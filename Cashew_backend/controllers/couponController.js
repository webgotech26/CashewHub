const pool = require('../config/db');

const getCoupons = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM coupons ORDER BY created_at DESC');
    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error('getCoupons error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

/**
 * POST /api/coupons/validate  — customer-facing, no admin gate
 * Body: { code, order_total }
 * Returns: { discount_type, discount_value, discount_amount, final_total }
 */
const validateCoupon = async (req, res) => {
  try {
    const { code, order_total } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Coupon code is required.' });

    const [rows] = await pool.query(
      `SELECT * FROM coupons
       WHERE UPPER(code) = UPPER(?)
         AND active = 1
         AND (expiry_date IS NULL OR expiry_date >= CURDATE())
         AND (max_uses IS NULL OR used_count < max_uses)`,
      [code.trim()]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Invalid or expired coupon code.' });
    }

    const coupon = rows[0];
    const total  = Number(order_total) || 0;

    if (coupon.min_order && total < Number(coupon.min_order)) {
      return res.status(400).json({
        success: false,
        message: `Minimum order of ₹${coupon.min_order} required to use this coupon.`,
      });
    }

    const discountAmount = coupon.discount_type === 'percentage'
      ? (total * Number(coupon.discount_value)) / 100
      : Math.min(Number(coupon.discount_value), total);  // flat, capped at total

    return res.status(200).json({
      success: true,
      data: {
        code:            coupon.code,
        discount_type:   coupon.discount_type,
        discount_value:  coupon.discount_value,
        discount_amount: parseFloat(discountAmount.toFixed(2)),
        final_total:     parseFloat((total - discountAmount).toFixed(2)),
      },
    });
  } catch (err) {
    console.error('validateCoupon error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const createCoupon = async (req, res) => {
  try {
    const { code, discount_type, discount_value, min_order, max_uses, expiry_date } = req.body;
    if (!code || !discount_value) return res.status(400).json({ success: false, message: 'code and discount_value are required.' });
    const [result] = await pool.query(
      `INSERT INTO coupons (code, discount_type, discount_value, min_order, max_uses, expiry_date, active)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [code.toUpperCase(), discount_type || 'percentage', discount_value,
       min_order || null, max_uses || null, expiry_date || null]
    );
    return res.status(201).json({ success: true, message: 'Coupon created.', data: { id: result.insertId, code } });
  } catch (err) {
    console.error('createCoupon error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, discount_type, discount_value, min_order, max_uses, expiry_date } = req.body;
    const [result] = await pool.query(
      `UPDATE coupons SET code=?, discount_type=?, discount_value=?, min_order=?, max_uses=?, expiry_date=? WHERE id=?`,
      [code, discount_type, discount_value, min_order || null, max_uses || null, expiry_date || null, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Coupon not found.' });
    return res.status(200).json({ success: true, message: 'Coupon updated.' });
  } catch (err) {
    console.error('updateCoupon error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const patchCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const { active } = req.body;
    await pool.query('UPDATE coupons SET active=? WHERE id=?', [active ? 1 : 0, id]);
    return res.status(200).json({ success: true, message: `Coupon ${active ? 'enabled' : 'disabled'}.` });
  } catch (err) {
    console.error('patchCoupon error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = { getCoupons, validateCoupon, createCoupon, updateCoupon, patchCoupon };
