const pool = require('../config/db');

const getReturns = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT r.*, c.name AS customer_name
      FROM returns r
      LEFT JOIN orders   o ON r.order_id    = o.id
      LEFT JOIN customers c ON o.customer_id = c.id
      ORDER BY r.created_at DESC
    `);
    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error('getReturns error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const updateReturn = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, refund_note } = req.body;
    const valid = ['pending', 'approved', 'rejected', 'refunded'];
    if (!valid.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status.' });

    const [result] = await pool.query(
      'UPDATE returns SET status=?, refund_note=? WHERE id=?',
      [status, refund_note || null, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Return not found.' });
    return res.status(200).json({ success: true, message: `Return ${status}.` });
  } catch (err) {
    console.error('updateReturn error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = { getReturns, updateReturn };
