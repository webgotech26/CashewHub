const pool = require('../config/db');
const { getIO } = require('../utils/socket');

/**
 * POST /api/orders
 * Creates a new order with order_items, auto-deducts stock,
 * and emits 'new-order' via Socket.io.
 *
 * Request body:
 * {
 *   items: [{ product_id, quantity }],
 *   notes: "optional"
 * }
 */
const createOrder = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { items, notes } = req.body;
    const customer_id = req.user.id;

    // Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      connection.release();
      return res.status(400).json({
        success: false,
        message: 'items array is required and must contain at least one item.',
      });
    }

    // Start transaction
    await connection.beginTransaction();

    // 1. Calculate order total and validate all products
    let orderTotal = 0;
    const validatedItems = [];

    for (const item of items) {
      if (!item.product_id || !item.quantity || item.quantity <= 0) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          success: false,
          message: 'Each item must have a valid product_id and quantity > 0.',
        });
      }

      // Lock the product row for update
      const [products] = await connection.query(
        'SELECT * FROM products WHERE id = ? FOR UPDATE',
        [item.product_id]
      );

      if (products.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({
          success: false,
          message: `Product with id ${item.product_id} not found.`,
        });
      }

      const product = products[0];

      if (parseFloat(product.stock_quantity) < parseFloat(item.quantity)) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.name}". Available: ${product.stock_quantity} ${product.unit}`,
        });
      }

      const unit_price = parseFloat(product.price);
      const line_total = unit_price * parseFloat(item.quantity);
      orderTotal += line_total;

      validatedItems.push({
        product_id: item.product_id,
        product_name: product.name,
        quantity: parseFloat(item.quantity),
        unit_price,
        line_total,
      });
    }

    // 2. Insert into orders table
    const [orderResult] = await connection.query(
      `INSERT INTO orders (customer_id, product_id, quantity, unit_price, total_amount, status, notes)
       VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
      [
        customer_id,
        validatedItems[0].product_id,
        validatedItems.reduce((sum, i) => sum + i.quantity, 0),
        validatedItems[0].unit_price,
        orderTotal,
        notes || null,
      ]
    );

    const orderId = orderResult.insertId;

    // 3. Insert into order_items table and deduct stock
    for (const item of validatedItems) {
      // Insert order item
      await connection.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price, line_total)
         VALUES (?, ?, ?, ?, ?)`,
        [orderId, item.product_id, item.quantity, item.unit_price, item.line_total]
      );

      // Auto-deduct stock from products table
      await connection.query(
        'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    // 4. Commit transaction
    await connection.commit();
    connection.release();

    // Build response data
    const orderData = {
      id: orderId,
      customer_id,
      items: validatedItems,
      total_amount: orderTotal,
      status: 'pending',
      notes: notes || null,
      created_at: new Date().toISOString(),
    };

    // 5. Emit real-time 'new-order' event via Socket.io
    getIO().emit('new-order', orderData);

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully. Stock updated.',
      data: orderData,
    });
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error('Create order error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

/**
 * GET /api/orders
 * Retrieves order history. Admins see all, customers see only their own.
 */
const getOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;

    let query = `
      SELECT o.*, c.name AS customer_name
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
    `;
    const params = [];

    // Customers only see their own orders
    if (req.user.role === 'customer') {
      query += ' WHERE o.customer_id = ?';
      params.push(req.user.id);
    }

    query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: { page, limit },
    });
  } catch (error) {
    console.error('Get orders error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

/**
 * GET /api/orders/:id
 * Retrieves a single order with its items.
 */
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch order
    let query = 'SELECT o.*, c.name AS customer_name FROM orders o JOIN customers c ON o.customer_id = c.id WHERE o.id = ?';
    const params = [id];

    if (req.user.role === 'customer') {
      query += ' AND o.customer_id = ?';
      params.push(req.user.id);
    }

    const [orders] = await pool.query(query, params);

    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Fetch order items
    const [items] = await pool.query(
      `SELECT oi.*, p.name AS product_name
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [id]
    );

    return res.status(200).json({
      success: true,
      data: { ...orders[0], items },
    });
  } catch (error) {
    console.error('Get order by ID error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

/**
 * PATCH /api/orders/:id/status
 * Admin-only: Updates order status.
 */
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
