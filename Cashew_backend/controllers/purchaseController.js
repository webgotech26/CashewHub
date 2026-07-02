const pool = require('../config/db');

const getPurchases = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT pu.*, s.name AS supplier_name, p.name AS product_name
      FROM purchases pu
      LEFT JOIN suppliers s ON pu.supplier_id = s.id
      LEFT JOIN products  p ON pu.product_id  = p.id
      ORDER BY pu.created_at DESC
    `);
    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error('getPurchases error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const createPurchase = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { supplier_id, product_id, quantity, unit_cost, batch_number, expiry_date, notes } = req.body;
    if (!product_id || !quantity || !unit_cost)
      return res.status(400).json({ success: false, message: 'product_id, quantity, and unit_cost are required.' });

    const total_cost = parseFloat(quantity) * parseFloat(unit_cost);

    await connection.beginTransaction();

    const [result] = await connection.query(
      `INSERT INTO purchases (supplier_id, product_id, quantity, unit_cost, total_cost, batch_number, expiry_date, notes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'received')`,
      [supplier_id || null, product_id, quantity, unit_cost, total_cost,
       batch_number || null, expiry_date || null, notes || null]
    );

    // Auto-increase stock on purchase
    await connection.query(
      'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?',
      [quantity, product_id]
    );

    await connection.commit();
    connection.release();

    return res.status(201).json({ success: true, message: 'Purchase recorded. Stock updated.', data: { id: result.insertId } });
  } catch (err) {
    await connection.rollback();
    connection.release();
    console.error('createPurchase error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = { getPurchases, createPurchase };
