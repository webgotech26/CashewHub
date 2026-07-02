const pool = require('../config/db');

const getInvoices = async (req, res) => {
  try {
    const page   = parseInt(req.query.page,  10) || 1;
    const limit  = parseInt(req.query.limit, 10) || 15;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    let query = `
      SELECT i.*, c.name AS customer_name
      FROM invoices i
      LEFT JOIN orders   o ON i.order_id    = o.id
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE 1=1
    `;
    const params = [];
    if (search) {
      query += ' AND (c.name LIKE ? OR i.id LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    query += ' ORDER BY i.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query(query, params);
    return res.status(200).json({ success: true, data: rows, pagination: { page, limit } });
  } catch (err) {
    console.error('getInvoices error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = { getInvoices };
