const pool = require('../config/db');

/**
 * GET /api/stock
 * Returns current stock summary per product (search optional).
 */
const getStock = async (req, res) => {
  try {
    const search = req.query.search || '';
    let query = `
      SELECT
        p.id       AS product_id,
        p.name     AS product_name,
        p.stock_quantity AS current_balance,
        c.name     AS category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const params = [];
    if (search) {
      query += ' AND p.name LIKE ?';
      params.push(`%${search}%`);
    }
    query += ' ORDER BY p.name ASC';
    const [rows] = await pool.query(query, params);
    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error('getStock error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

/**
 * POST /api/stock
 * Records a stock adjustment and updates products.stock_quantity.
 */
const createStockEntry = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { product_id, quantity_in = 0, quantity_out = 0, notes } = req.body;
    if (!product_id) {
      connection.release();
      return res.status(400).json({ success: false, message: 'product_id is required.' });
    }

    await connection.beginTransaction();

    // Verify product exists
    const [products] = await connection.query(
      'SELECT id, stock_quantity FROM products WHERE id = ? FOR UPDATE',
      [product_id]
    );
    if (products.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const newQty = parseFloat(products[0].stock_quantity)
      + parseFloat(quantity_in)
      - parseFloat(quantity_out);

    if (newQty < 0) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ success: false, message: 'Insufficient stock for this deduction.' });
    }

    // Update product stock
    await connection.query(
      'UPDATE products SET stock_quantity = ? WHERE id = ?',
      [newQty, product_id]
    );

    await connection.commit();
    connection.release();

    return res.status(201).json({
      success: true,
      message: 'Stock entry recorded.',
      data: { product_id, quantity_in, quantity_out, new_balance: newQty, notes },
    });
  } catch (err) {
    await connection.rollback();
    connection.release();
    console.error('createStockEntry error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = { getStock, createStockEntry };
