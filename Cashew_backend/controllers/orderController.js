const pool = require('../config/db');
const { getIO } = require('../utils/socket');
const { sendWhatsAppAlert, sendCustomerWhatsApp } = require('../utils/whatsapp');
const { sendOrderConfirmationEmail } = require('../utils/email');

/**
 * POST /api/orders
 *
 * Actual database columns (corrected):
 *   orders      → customer_id, total_amount, status, notes, address
 *   deliveries  → order_id, status  (NO address column)
 *   order_items → order_id, product_id, quantity, unit_price, line_total
 *
 * req.body expected:
 *   items          — [{ product_id, quantity }]
 *   address        — full delivery address string (→ orders.address)
 *   payment_method — 'upi' | 'card' | 'netbanking'  (→ orders.notes)
 *
 * All SQL uses prepared statements (?) to prevent injection.
 * Full ACID transaction: beginTransaction → commit / rollback.
 */
const createOrder = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { items, address, payment_method } = req.body;
    const customer_id = req.user.id;

    // ── Input validation ───────────────────────────────────────────
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

    // ── BEGIN TRANSACTION ──────────────────────────────────────────
    await connection.beginTransaction();

    // ── Fetch customer details for notifications ───────────────────
    const [customerRows] = await connection.query(
      'SELECT name, email, mobile FROM customers WHERE id = ?',
      [customer_id]
    );

    const customer = customerRows[0] || {};
    const customerName  = customer.name  || 'Valued Customer';
    const customerEmail = customer.email || null;
    const customerPhone = customer.mobile || null;

    // ── STEP 1: Validate products & calculate total ────────────────
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

      const [rows] = await connection.query(
        'SELECT id, name, price, stock_quantity FROM products WHERE id = ? FOR UPDATE',
        [item.product_id]
      );

      if (rows.length === 0) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({
          success: false,
          message: `Product with id ${item.product_id} not found.`,
        });
      }

      const product = rows[0];

      if (parseFloat(product.stock_quantity) < parseFloat(item.quantity)) {
        await connection.rollback();
        connection.release();
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.name}". Available: ${product.stock_quantity}.`,
        });
      }

      const unit_price = parseFloat(product.price);
      const line_total = unit_price * parseFloat(item.quantity);
      orderTotal += line_total;

      validatedItems.push({
        product_id:   item.product_id,
        product_name: product.name,
        quantity:     parseFloat(item.quantity),
        unit_price,
        line_total,
      });
    }

    // ── STEP 2: INSERT into orders ─────────────────────────────────
    // Check which optional columns exist before inserting into them.
    const [colCheck] = await connection.query(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME   = 'orders'
         AND COLUMN_NAME  IN ('address', 'notes')`
    );
    const cols         = new Set(colCheck.map(r => r.COLUMN_NAME));
    const hasAddress   = cols.has('address');
    const hasNotes     = cols.has('notes');

    let insertSQL    = 'INSERT INTO orders (customer_id, total_amount, status';
    let insertValues = [customer_id, orderTotal, 'pending'];

    if (hasAddress) { insertSQL += ', address'; insertValues.push(address.trim()); }
    if (hasNotes)   { insertSQL += ', notes';   insertValues.push(`Payment: ${payment_method.toUpperCase()}`); }

    insertSQL += ') VALUES (' + insertValues.map(() => '?').join(', ') + ')';

    const [orderResult] = await connection.query(insertSQL, insertValues);

    const orderId = orderResult.insertId;

    // ── STEP 3: INSERT into deliveries (NO address column) ─────────
    // deliveries table only tracks order_id + delivery status
    await connection.query(
      'INSERT INTO deliveries (order_id, status) VALUES (?, ?)',
      [orderId, 'pending']
    );

    // ── STEP 4: Bulk INSERT into order_items ───────────────────────
    // Actual columns: order_id | product_id | quantity | price
    const orderItemRows = validatedItems.map(item => [
      orderId,
      item.product_id,
      item.quantity,
      item.unit_price,   // → price column
    ]);

    await connection.query(
      'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?',
      [orderItemRows]
    );

    // ── STEP 5: Deduct stock ───────────────────────────────────────
    for (const item of validatedItems) {
      await connection.query(
        'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    // ── COMMIT ─────────────────────────────────────────────────────
    await connection.commit();
    connection.release();

    // ── STEP 6: Emit real-time Socket.io event ─────────────────────
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

    getIO().emit('new-order', orderData);

    // ── STEP 7: Send notifications (fire-and-forget, non-blocking) ─
    // These must NEVER block the order response. Use .catch() to log
    // errors without crashing the request handler.

    // ★ Admin WhatsApp alert
    sendWhatsAppAlert(orderData).catch(err =>
      console.error(`[WhatsApp] Admin alert failed for Order #${orderId}:`, err.message)
    );

    // ★ Customer WhatsApp notification
    if (customerPhone) {
      sendCustomerWhatsApp({
        to: customerPhone,
        customerName,
        orderData,
      }).catch(err =>
        console.error(`[WhatsApp] Customer notification failed for Order #${orderId}:`, err.message)
      );
    } else {
      console.warn(`[WhatsApp] Customer notification skipped for Order #${orderId} — no phone number.`);
    }

    // ★ Customer Email confirmation
    if (customerEmail) {
      sendOrderConfirmationEmail({
        customerEmail,
        customerName,
        orderData,
      }).catch(err =>
        console.error(`[Email] Confirmation failed for Order #${orderId}:`, err.message)
      );
    } else {
      console.warn(`[Email] Confirmation skipped for Order #${orderId} — no email address.`);
    }

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully.',
      data:    orderData,
    });

  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error('createOrder error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error. Order was not placed.',
    });
  }
};

/**
 * GET /api/orders
 * Retrieves order history with aggregated product names and quantities.
 *
 * Handles two data layouts:
 *   Modern  — items stored in order_items table (GROUP_CONCAT + SUM)
 *   Legacy  — product_id / quantity stored directly on orders row (fallback)
 *
 * Response per row includes:
 *   product_names — e.g. "Premium 210, Roasted Cashew" (or legacy product name)
 *   total_qty     — total quantity across all items
 */
const getOrders = async (req, res) => {
  try {
    const page   = parseInt(req.query.page,  10) || 1;
    const limit  = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;

    /*
     * Check which optional columns exist in the orders table.
     * 'address' and 'notes' were added in a later migration — older
     * databases may not have them yet.  We select them only when present
     * so the query never throws "Unknown column" errors.
     */
    const [colRows] = await pool.query(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME   = 'orders'
         AND COLUMN_NAME  IN ('address', 'notes')`
    );
    const existingCols = new Set(colRows.map(r => r.COLUMN_NAME));
    const hasAddress   = existingCols.has('address');
    const hasNotes     = existingCols.has('notes');

    // Build optional SELECT fragments
    const addressSelect = hasAddress ? ',\n        o.address' : '';
    const notesSelect   = hasNotes   ? ',\n        o.notes'   : '';

    // GROUP BY must list every non-aggregated SELECT column
    const addressGroup  = hasAddress ? ', o.address' : '';
    const notesGroup    = hasNotes   ? ', o.notes'   : '';

    let query = `
      SELECT
        o.id,
        o.customer_id,
        o.total_amount,
        o.status,
        o.created_at${addressSelect}${notesSelect},
        c.name AS customer_name,

        COALESCE(
          NULLIF(GROUP_CONCAT(DISTINCT p.name ORDER BY p.name SEPARATOR ', '), ''),
          'No items'
        ) AS product_names,

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
      LEFT JOIN customers   c  ON c.id          = o.customer_id
      LEFT JOIN order_items oi ON oi.order_id   = o.id
      LEFT JOIN products    p  ON p.id          = oi.product_id
    `;

    const params = [];

    if (req.user.role === 'customer') {
      query += ' WHERE o.customer_id = ?';
      params.push(req.user.id);
    }

    query += `
      GROUP BY
        o.id, o.customer_id, o.total_amount, o.status,
        o.created_at${addressGroup}${notesGroup}, c.name
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

/**
 * GET /api/orders/:id
 * Returns a single order with a clean `items` array.
 *
 * Response shape:
 * {
 *   id, customer_id, customer_name, total_amount, status, created_at,
 *   items: [
 *     { product_id, product_name, quantity, unit_price, line_total }
 *   ]
 * }
 */
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    // ── Check which optional columns exist ───────────────────────
    const [colRows] = await pool.query(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME   = 'orders'
         AND COLUMN_NAME  IN ('address', 'notes')`
    );
    const existingCols = new Set(colRows.map(r => r.COLUMN_NAME));
    const addressSel   = existingCols.has('address') ? ',\n        o.address' : '';
    const notesSel     = existingCols.has('notes')   ? ',\n        o.notes'   : '';

    // ── Fetch order header ───────────────────────────────────────
    let orderQuery = `
      SELECT
        o.id,
        o.customer_id,
        o.total_amount,
        o.status,
        o.created_at${addressSel}${notesSel},
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

    // ── Fetch order items ────────────────────────────────────────
    // Real order_items columns: id, order_id, product_id, quantity, price
    // Alias oi.price → unit_price; calculate line_total inline.
    const [itemRows] = await pool.query(
      `SELECT
         oi.product_id,
         p.name                   AS product_name,
         p.image_url              AS image_url,
         oi.quantity,
         oi.price                 AS unit_price,
         (oi.quantity * oi.price) AS line_total
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
