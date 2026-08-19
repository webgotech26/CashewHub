const pool = require('../config/db');

/**
 * formatDate — safely converts any date value to YYYY-MM-DD or null.
 *
 * Handles:
 *   ''                          → null  (empty string from form)
 *   null / undefined            → null
 *   '2026-08-24'                → '2026-08-24'  (already correct)
 *   '2026-08-24T00:00:00.000Z'  → '2026-08-24'  (ISO string from frontend)
 *   new Date()                  → 'YYYY-MM-DD'   (Date object)
 *
 * Never throws — returns null on any invalid input.
 */
function formatDate(value) {
  if (!value && value !== 0) return null;
  const s = String(value).trim();
  if (!s) return null;
  try {
    const d = new Date(s);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().split('T')[0]; // 'YYYY-MM-DD'
  } catch {
    return null;
  }
}

/**
 * GET /api/coupons/active  — public, customer-facing
 * Returns all active, non-expired coupons with available uses.
 * Intentionally omits internal fields (max_uses, used_count).
 */
const getActiveCoupons = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         id, code, discount_type, discount_value,
         min_order_amount, expiry_date
       FROM coupons
       WHERE is_active = 1
         AND (expiry_date IS NULL OR expiry_date >= CURDATE())
         AND (max_uses    IS NULL OR used_count < max_uses)
       ORDER BY discount_value DESC`
    );
    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error('getActiveCoupons error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

/**
 * GET /api/coupons  — admin list
 * Actual DB columns (confirmed from MySQL Workbench):
 *   id, code, discount_percentage, is_active, created_at,
 *   discount_type, discount_value, min_order_amount, max_uses, expiry_date
 */
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
 */
const validateCoupon = async (req, res) => {
  try {
    const { code, order_total } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Coupon code is required.' });

    const [rows] = await pool.query(
      `SELECT * FROM coupons
       WHERE UPPER(code) = UPPER(?)
         AND is_active = 1
         AND (expiry_date IS NULL OR expiry_date >= CURDATE())
         AND (max_uses IS NULL OR used_count < max_uses)`,
      [code.trim()]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Invalid or expired coupon code.' });
    }

    const coupon = rows[0];
    const total  = Number(order_total) || 0;

    /* min_order_amount check */
    if (coupon.min_order_amount && total < Number(coupon.min_order_amount)) {
      return res.status(400).json({
        success: false,
        message: `Minimum order of ₹${coupon.min_order_amount} required to use this coupon.`,
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

/**
 * POST /api/coupons  — admin create
 * Accepts both field names for backward compatibility:
 *   min_order_amount  (DB column name — preferred)
 *   min_order         (legacy frontend name — accepted as alias)
 */
const createCoupon = async (req, res) => {
  try {
    const {
      code,
      discount_type,
      discount_value,
      min_order_amount,   // correct DB name
      min_order,          // legacy alias — frontend may still send this
      max_uses,
      expiry_date,
    } = req.body;

    if (!code || !discount_value) {
      return res.status(400).json({
        success: false,
        message: 'code and discount_value are required.',
      });
    }

    /* Accept either field name for the minimum order */
    const minAmt = min_order_amount ?? min_order ?? null;

    console.log('[createCoupon] Inserting:', {
      code: code.toUpperCase(),
      discount_type: discount_type || 'percentage',
      discount_value,
      min_order_amount: minAmt,
      max_uses: max_uses || null,
      expiry_date: expiry_date || null,
    });

    const [result] = await pool.query(
      `INSERT INTO coupons
         (code, discount_type, discount_value, discount_percentage,
          min_order_amount, max_uses, expiry_date, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        code.toUpperCase(),
        discount_type || 'percentage',
        discount_value,
        /* Keep discount_percentage in sync — set it when type is percentage, else null */
        (discount_type === 'percentage' || !discount_type) ? discount_value : null,
        minAmt,
        max_uses   || null,
        formatDate(expiry_date),
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Coupon created.',
      data: { id: result.insertId, code: code.toUpperCase() },
    });
  } catch (err) {
    console.error('createCoupon error:', err.message);
    return res.status(500).json({ success: false, message: err.message || 'Internal server error.' });
  }
};

/**
 * PUT /api/coupons/:id  — admin update
 */
const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      code,
      discount_type,
      discount_value,
      min_order_amount,
      min_order,          // legacy alias
      max_uses,
      expiry_date,
    } = req.body;

    const minAmt = min_order_amount ?? min_order ?? null;

    const [result] = await pool.query(
      `UPDATE coupons
       SET code=?, discount_type=?, discount_value=?, discount_percentage=?,
           min_order_amount=?, max_uses=?, expiry_date=?
       WHERE id=?`,
      [
        code,
        discount_type,
        discount_value,
        /* Keep discount_percentage in sync */
        discount_type === 'percentage' ? discount_value : null,
        minAmt,
        max_uses    || null,
        formatDate(expiry_date),
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Coupon not found.' });
    }
    return res.status(200).json({ success: true, message: 'Coupon updated.' });
  } catch (err) {
    console.error('updateCoupon error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

/**
 * PATCH /api/coupons/:id  — toggle is_active
 */
const patchCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const { active } = req.body;
    await pool.query('UPDATE coupons SET is_active=? WHERE id=?', [active ? 1 : 0, id]);
    return res.status(200).json({ success: true, message: `Coupon ${active ? 'enabled' : 'disabled'}.` });
  } catch (err) {
    console.error('patchCoupon error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

/**
 * DELETE /api/coupons/:id  — admin delete
 */
const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM coupons WHERE id=?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Coupon not found.' });
    }
    return res.status(200).json({ success: true, message: 'Coupon deleted.' });
  } catch (err) {
    console.error('deleteCoupon error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = { getCoupons, getActiveCoupons, validateCoupon, createCoupon, updateCoupon, patchCoupon, deleteCoupon };
