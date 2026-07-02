const pool = require('../config/db');

const getReviews = async (req, res) => {
  try {
    const status = req.query.status || 'pending';
    const [rows] = await pool.query(`
      SELECT r.*, c.name AS customer_name, p.name AS product_name
      FROM reviews r
      LEFT JOIN customers c ON r.customer_id = c.id
      LEFT JOIN products  p ON r.product_id  = p.id
      WHERE r.status = ?
      ORDER BY r.created_at DESC
    `, [status]);
    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error('getReviews error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const moderateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const valid = ['pending', 'approved', 'rejected'];
    if (!valid.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status.' });
    const [result] = await pool.query('UPDATE reviews SET status=? WHERE id=?', [status, id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Review not found.' });
    return res.status(200).json({ success: true, message: `Review ${status}.` });
  } catch (err) {
    console.error('moderateReview error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = { getReviews, moderateReview };
