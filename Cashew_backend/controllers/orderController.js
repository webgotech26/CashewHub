const pool = require('../config/db');
const { getIO } = require('../utils/socket');
const { sendWhatsAppAlert, sendCustomerWhatsApp } = require('../utils/whatsapp');
const { sendOrderConfirmationEmail } = require('../utils/email');

const createOrder = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { items, address, payment_method } = req.body;
    const customer_id = req.user.id;

    if (!items || !Array.isArray(items) || items.length === 0) {
      connection.release();
      return res.status(400).json({
        success: false,
        message: 'items array is required and must contain at least one item.',
      });
    }

    if (!address || !address.trim()) {
      connection.release();
      return res.status(400).json({
        success: false,
        message: 'Delivery address is required.',
      });
    }

    if (!payment_method || !['upi', 'card', 'netbanking'].includes(payment_method)) {
      connection.release();
      return res.status(400).json({
        success: false,
        message: 'payment_method must be one of: upi, card, netbanking.',
      });
    }

    await connection.beginTransaction();

    const [customerRows] = await connection.query(
      'SELECT name, email, mobile FROM customers WHERE id = ?',
      [customer_id]
    );

    const customer = customerRows[0] || {};
    const customerName  = customer.name  || 'Valued Customer';
    const customerEmail = customer.email || null;
    const customerPhone = customer.mobile || null;

    let orderTotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const prodId = item.product_id || item.id;
      const qty = parseFloat(item.quantity || item.qty);

      if (!prodId || !qty || qty <= 0) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          success: false,
          message: 'Each item must have a valid product_id and quantity > 0.',
        });
      }

      const [rows] = await connection.query(
        'SELECT id, name, price, stock_quantity FROM products WHERE id = ? FOR UPDATE',
        [prodId]
      );

      if (rows.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({
          success: false,
          message: `Product with id ${prodId} not found.`,
        });
      }

      const product = rows[0];

      if (parseFloat(product.stock_quantity) < qty) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.name}". Available: ${product.stock_quantity}.`,
        });
      }

      const unit_price = parseFloat(product.price);
      const line_total = unit_price * qty;
      orderTotal += line_total;

      validatedItems.push({
        product_id:   prodId,
        product_name: product.name,
        quantity:     qty,
        unit_price,
        line_total,
      });
    }

    const [orderResult] = await connection.query(
      'INSERT INTO orders (customer_id, total_amount, status, address, ) VALUES (?, ?, ?, ?, ?)',
      [customer_id, orderTotal, 'pending', address.trim(), `Payment: ${payment_method.toUpperCase()}`]
    );

    const orderId = orderResult.insertId;

    await connection.query(
      'INSERT INTO deliveries (order_id, status) VALUES (?, ?)',
      [orderId, 'pending']
    );

    for (const item of validatedItems) {
      await connection.query(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price, line_total) VALUES (?, ?, ?, ?, ?)',
        [orderId, item.product_id, item.quantity, item.unit_price, item.line_total]
      );
    }

    for (const item of validatedItems) {
      await connection.query(
        'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    await connection.commit();
    connection.release();

    const orderData = {
      id:            orderId,
      customer_id,
      customer_name: customerName,
      items:         validatedItems,
      total_amount:  orderTotal,
      status:        'pending',
      address:       address.trim(),
      payment_method,
      created_at:    new Date().toISOString(),
    };

    try {
      getIO().emit('new-order', orderData);
    } catch (socketErr) {
      console.error('Socket emit error:', socketErr.message);
    }

    sendWhatsAppAlert(orderData).catch(err =>
      console.error(`[WhatsApp] Admin alert failed for Order #${orderId}:`, err.message)
    );

    if (customerPhone) {
      sendCustomerWhatsApp({
        to: customerPhone,
        customerName,
        orderData,
      }).catch(err =>
        console.error(`[WhatsApp] Customer notification failed for Order #${orderId}:`, err.message)
      );
    }

    if (customerEmail) {
      sendOrderConfirmationEmail({
        customerEmail,
        customerName,
        orderData,
      }).catch(err =>
        console.error(`[Email] Confirmation failed for Order #${orderId}:`, err.message)
      );
    }

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully.',
      data:    orderData,
    });

  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error('createOrder error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error. Order was not placed.',
    });
  }
};

const getOrders = async (req, res) => {
  try {
    const page   = parseInt(req.query.page,  10) || 1;
    const limit  = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;

    let query = `
      SELECT
        o.id,
        o.customer_id,
        o.total_amount,
        o.status,
        o.created_at,
        o.address,
        o.notes,
        c.name AS customer_name,
        COALESCE(NULLIF(GROUP_CONCAT(DISTINCT p.name ORDER BY p.name SEPARATOR ', '), ''), 'No items') AS product_names,
        (
          SELECT p2.image_url
          FROM order_items oi2
          JOIN products p2 ON p2.id = oi2.product_id
          WHERE oi2.order_id = o.id
            AND p2.image_url IS NOT NULL
            AND p2.image_url != ''
          ORDER BY oi2.id ASC
          LIMIT 1
        ) AS image_url,
        COALESCE(NULLIF(SUM(oi.quantity), 0), 0) AS total_qty
      FROM orders o
      LEFT JOIN customers   c  ON c.id        = o.customer_id
      LEFT JOIN order_items oi ON oi.order_id   = o.id
      LEFT JOIN products    p  ON p.id        = oi.product_id
    `;

    const params = [];

    if (req.user.role === 'customer') {
      query += ' WHERE o.customer_id = ?';
      params.push(req.user.id);
    }

    query += `
      GROUP BY o.id, o.customer_id, o.total_amount, o.status, o.created_at, o.address, o.notes, c.name
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `;
    params.push(limit, offset);

    const [rows] = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: { page, limit },
    });
  } catch (error) {
    console.error('getOrders error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    let orderQuery = `
      SELECT
        o.id,
        o.customer_id,
        o.total_amount,
        o.status,
        o.created_at,
        o.address,
        o.notes,
        c.name   AS customer_name,
        c.email  AS customer_email,
        c.mobile AS customer_mobile
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      WHERE o.id = ?
    `;
    const orderParams = [id];

    if (req.user.role === 'customer') {
      orderQuery += ' AND o.customer_id = ?';
      orderParams.push(req.user.id);
    }

    const [orderRows] = await pool.query(orderQuery, orderParams);

    if (orderRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const order = orderRows[0];

    const [itemRows] = await pool.query(
      `SELECT
          oi.product_id,
          p.name AS product_name,
          p.image_url AS image_url,
          oi.quantity,
          oi.unit_price AS unit_price,
          oi.line_total AS line_total
        FROM order_items oi
        JOIN products p ON p.id = oi.product_id
        WHERE oi.order_id = ?
        ORDER BY oi.id ASC`,
      [id]
    );

    return res.status(200).json({
      success: true,
      data: { ...order, items: itemRows },
    });
  } catch (error) {
    console.error('getOrderById error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const [result] = await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    return res.status(200).json({
      success: true,
      message: `Order #${id} status updated to '${status}'.`,
    });
  } catch (error) {
    console.error('Update order status error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = { createOrder, getOrders, getOrderById, updateOrderStatus };