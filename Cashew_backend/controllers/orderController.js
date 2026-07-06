const pool = require('../config/db');
const { getIO } = require('../utils/socket');

/**
 * POST /api/orders
 *
 * Normalized schema:
 *   orders       → (customer_id, total_amount, status)
 *   deliveries   → (order_id, delivery_address)
 *   order_items  → (order_id, product_id, quantity, price)
 *
 * All SQL uses prepared statements (?) to prevent injection.
 * Full ACID transaction: beginTransaction → commit / rollback.
 */
const createOrder = async (req, res) => {
  // Acquire a dedicated connection for the transaction
  const connection = await pool.getConnection();

  try {
    const { items, address, notes } = req.body;
    const customer_id = req.user.id;

    // ── Input validation ───────────────────────────────────────────
    if (!items || !Array.isArray(items) || items.length === 0) {
      connection.release();
      return res.status(400).json({
        success: false,
        message: 'items array is required and must contain at least one item.',
      });
    }

    // ── BEGIN TRANSACTION ──────────────────────────────────────────
    await connection.beginTransaction();

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

      // Row-level lock prevents race conditions on concurrent orders
      const [rows] = await connection.query(
        'SELECT id, name, price, stock_quantity FROM products WHERE id = ? FOR UPDATE',
        [item.product_id]   // prepared statement — SQL injection safe
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
        product_id: item.product_id,
        product_name: product.name,
        quantity: parseFloat(item.quantity),
        unit_price,
        line_total,
      });
    }

    // ── STEP 2: INSERT into orders (no address/notes — wrong table) ─
    // orders schema: id | customer_id | total_amount | status | created_at
    const [orderResult] = await connection.query(
      'INSERT INTO orders (customer_id, total_amount, status) VALUES (?, ?, ?)',
      [customer_id, orderTotal, 'pending']   // ? placeholders — no string concat
    );

    const orderId = orderResult.insertId;

    // ── STEP 3: INSERT address into deliveries (separate table) ────
    // delivery_address uses ? placeholder → special chars in address are safe
    if (address) {
      await connection.query(
        'INSERT INTO deliveries (order_id, delivery_address, status) VALUES (?, ?, ?)',
        [orderId, address, 'pending']   // prepared statement prevents injection
      );
    }

    // ── STEP 4: Bulk INSERT into order_items ───────────────────────
    // order_items schema: order_id | product_id | quantity | price
    const orderItemRows = validatedItems.map(item => [
      orderId,
      item.product_id,
      item.quantity,
      item.unit_price,    // maps to `price` column
    ]);

    // Single multi-row INSERT — more efficient than N separate queries
    await connection.query(
      'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?',
      [orderItemRows]     // mysql2 expands [[v1,...],[v2,...]] correctly
    );

    // ── STEP 5: Deduct stock for each product ───────────────────────
    for (const item of validatedItems) {
      await connection.query(
        'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
        [item.quantity, item.product_id]   // prepared statement
      );
    }

    // ── COMMIT ─────────────────────────────────────────────────────
    await connection.commit();
    connection.release();

    // ── STEP 6: Emit real-time Socket.io event ─────────────────────
    const orderData = {
      id: orderId,
      customer_id,
      items: validatedItems,
      total_amount: orderTotal,
      status: 'pending',
      delivery_address: address || null,
      created_at: new Date().toISOString(),
    };

    getIO().emit('new-order', orderData);

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully.',
      data: orderData,
    });

  } catch (error) {
    // ── ROLLBACK on any error ──────────────────────────────────────
    // Ensures partial inserts are never committed
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

    let query = `
      SELECT
        o.id,
        o.customer_id,
        o.total_amount,
        o.status,
        o.created_at,
        c.name AS customer_name,

        /* GROUP_CONCAT product names from order_items → products JOIN */
        COALESCE(
          NULLIF(GROUP_CONCAT(DISTINCT p.name ORDER BY p.name SEPARATOR ', '), ''),
          'No items'
        ) AS product_names,

        /* SUM quantities from order_items */
        COALESCE(NULLIF(SUM(oi.quantity), 0), 0) AS total_qty

      FROM orders o
      LEFT JOIN customers  c  ON c.id         = o.customer_id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN products    p  ON p.id        = oi.product_id
    `;

    const params = [];

    if (req.user.role === 'customer') {
      query += ' WHERE o.customer_id = ?';
      params.push(req.user.id);
    }

    /* GROUP BY required for GROUP_CONCAT / SUM */
    query += `
      GROUP BY
        o.id, o.customer_id, o.total_amount, o.status,
        o.created_at, c.name
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

    // ── Fetch order header ───────────────────────────────────────
    let orderQuery = `
      SELECT
        o.id,
        o.customer_id,
        o.total_amount,
        o.status,
        o.created_at,
        c.name   AS customer_name,
        c.email  AS customer_email,
        c.mobile AS customer_mobile
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      WHERE o.id = ?
    `;
    const orderParams = [id];

    // Customers can only view their own orders
    if (req.user.role === 'customer') {
      orderQuery += ' AND o.customer_id = ?';
      orderParams.push(req.user.id);
    }

    const [orderRows] = await pool.query(orderQuery, orderParams);

    if (orderRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const order = orderRows[0];

    // ── Fetch order items with JOIN to products ──────────────────
    // Explicitly alias oi.price → unit_price so the frontend
    // never gets undefined regardless of column naming conventions.
    const [itemRows] = await pool.query(
      `SELECT
         oi.product_id,
         p.name          AS product_name,
         oi.quantity,
         oi.price        AS unit_price,
         (oi.quantity * oi.price) AS line_total
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?
       ORDER BY oi.id ASC`,
      [id]   // prepared statement — SQL injection safe
    );

    // ── Build grouped response ───────────────────────────────────
    return res.status(200).json({
      success: true,
      data: {
        ...order,
        items: itemRows,   // always an array, never undefined
      },
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
