const pool = require('../config/db');

const getDeliveries = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT d.*, c.name AS customer_name, o.total_amount
      FROM deliveries d
      LEFT JOIN orders    o ON d.order_id    = o.id
      LEFT JOIN customers c ON o.customer_id = c.id
      ORDER BY d.created_at DESC
    `);
    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error('getDeliveries error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const updateDeliveryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const valid = ['pending', 'dispatched', 'out_for_delivery', 'delivered', 'failed'];
    if (!valid.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status.' });
    const [result] = await pool.query('UPDATE deliveries SET status=? WHERE id=?', [status, id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Delivery not found.' });
    return res.status(200).json({ success: true, message: `Delivery status updated to '${status}'.` });
  } catch (err) {
    console.error('updateDeliveryStatus error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { id } = req.params;
    const { otp } = req.body;
    if (!otp) return res.status(400).json({ success: false, message: 'OTP is required.' });

    const [rows] = await pool.query('SELECT * FROM deliveries WHERE id=?', [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Delivery not found.' });

    if (String(rows[0].delivery_otp) !== String(otp))
      return res.status(401).json({ success: false, message: 'Invalid OTP.' });

    await pool.query('UPDATE deliveries SET status=? WHERE id=?', ['delivered', id]);
    return res.status(200).json({ success: true, message: 'Delivery confirmed via OTP.' });
  } catch (err) {
    console.error('verifyOtp error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = { getDeliveries, updateDeliveryStatus, verifyOtp };
