const pool = require('../config/db');

const getAuditLogs = async (req, res) => {
  try {
    const page   = parseInt(req.query.page,  10) || 1;
    const limit  = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    let query  = 'SELECT * FROM audit_logs WHERE 1=1';
    const params = [];
    if (search) {
      query += ' AND (user_name LIKE ? OR action LIKE ? OR module LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query(query, params);
    return res.status(200).json({ success: true, data: rows, pagination: { page, limit } });
  } catch (err) {
    console.error('getAuditLogs error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = { getAuditLogs };
