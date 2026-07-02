const bcrypt = require('bcrypt');
const pool = require('../config/db');

const SALT_ROUNDS = 12;

const getAdmins = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, username, role, created_at FROM admins ORDER BY created_at DESC'
    );
    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error('getAdmins error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const createAdmin = async (req, res) => {
  try {
    const { name, username, password, role } = req.body;
    if (!name || !username || !password)
      return res.status(400).json({ success: false, message: 'name, username, and password are required.' });

    const [existing] = await pool.query('SELECT id FROM admins WHERE username=?', [username]);
    if (existing.length > 0)
      return res.status(409).json({ success: false, message: 'Username already taken.' });

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const [result] = await pool.query(
      'INSERT INTO admins (name, username, password, role) VALUES (?, ?, ?, ?)',
      [name, username, hashed, role || 'staff']
    );
    return res.status(201).json({ success: true, message: 'Admin user created.', data: { id: result.insertId, name, username } });
  } catch (err) {
    console.error('createAdmin error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM admins WHERE id=?', [id]);
    if (result.affectedRows === 0)
      return res.status(404).json({ success: false, message: 'Admin not found.' });
    return res.status(200).json({ success: true, message: 'Admin removed.' });
  } catch (err) {
    console.error('deleteAdmin error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const getAdminStats = async (req, res) => {
  try {
    const [[orders]]    = await pool.query("SELECT COUNT(*) AS total FROM orders");
    const [[today]]     = await pool.query("SELECT COUNT(*) AS total FROM orders WHERE DATE(created_at) = CURDATE()");
    const [[revenue]]   = await pool.query("SELECT COALESCE(SUM(total_amount),0) AS total FROM orders WHERE status != 'cancelled'");
    const [[customers]] = await pool.query("SELECT COUNT(*) AS total FROM customers");
    const [[pending]]   = await pool.query("SELECT COUNT(*) AS total FROM orders WHERE status='pending'");
    const [[lowStock]]  = await pool.query("SELECT COUNT(*) AS total FROM products WHERE stock_quantity <= 10 AND stock_quantity > 0");

    return res.status(200).json({
      success: true,
      data: {
        totalOrders:    orders.total,
        todayOrders:    today.total,
        totalRevenue:   parseFloat(revenue.total),
        totalCustomers: customers.total,
        pendingOrders:  pending.total,
        lowStock:       lowStock.total,
      },
    });
  } catch (err) {
    console.error('getAdminStats error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = { getAdmins, createAdmin, deleteAdmin, getAdminStats };
