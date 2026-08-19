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

/**
 * GET /api/admin/charts
 * Returns data for the admin dashboard charts:
 *   - dailyRevenue: last 30 days revenue + order count
 *   - topProducts: top 5 products by revenue
 *   - ordersByStatus: count per status
 */
const getChartData = async (req, res) => {
  try {
    /* Last 30 days — one row per day */
    const [daily] = await pool.query(`
      SELECT
        DATE(created_at) AS date,
        COUNT(*)                                      AS orders,
        COALESCE(SUM(total_amount), 0)                AS revenue
      FROM orders
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        AND status != 'cancelled'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    /* Top 5 selling products by revenue */
    const [topProducts] = await pool.query(`
      SELECT
        p.name,
        SUM(oi.line_total) AS revenue,
        SUM(oi.quantity)   AS units_sold
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      JOIN orders o ON o.id = oi.order_id
      WHERE o.status != 'cancelled'
      GROUP BY oi.product_id, p.name
      ORDER BY revenue DESC
      LIMIT 5
    `);

    /* Orders by status */
    const [byStatus] = await pool.query(`
      SELECT status, COUNT(*) AS count
      FROM orders
      GROUP BY status
    `);

    return res.status(200).json({
      success: true,
      data: {
        dailyRevenue: daily.map(r => ({
          date:    r.date,
          orders:  Number(r.orders),
          revenue: parseFloat(r.revenue),
        })),
        topProducts: topProducts.map(r => ({
          name:       r.name,
          revenue:    parseFloat(r.revenue),
          units_sold: Number(r.units_sold),
        })),
        ordersByStatus: byStatus.map(r => ({
          status: r.status,
          count:  Number(r.count),
        })),
      },
    });
  } catch (err) {
    console.error('getChartData error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = { getAdmins, createAdmin, deleteAdmin, getAdminStats, getChartData };
