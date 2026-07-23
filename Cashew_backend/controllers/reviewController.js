'use strict';
const pool = require('../config/db');

/* ── Detects whether reviews.status column exists (cached) ─────── */
let _reviewsHasStatus = null;

async function reviewsHasStatus() {
  if (_reviewsHasStatus !== null) return _reviewsHasStatus;
  const [cols] = await pool.query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME   = 'reviews'
       AND COLUMN_NAME  = 'status'`
  );
  _reviewsHasStatus = cols.length > 0;
  return _reviewsHasStatus;
}

/* ─────────────────────────────────────────────────────────────────
   Admin: list reviews, filtered by status when column exists
   ───────────────────────────────────────────────────────────────── */
const getReviews = async (req, res) => {
  try {
    const hasStatus = await reviewsHasStatus();
    const status    = req.query.status || 'pending';

    let query = `
      SELECT r.*, c.name AS customer_name, p.name AS product_name
      FROM reviews r
      LEFT JOIN customers c ON c.id = r.customer_id
      LEFT JOIN products  p ON p.id = r.product_id
    `;
    const params = [];

    if (hasStatus) {
      query += ' WHERE r.status = ?';
      params.push(status);
    }

    query += ' ORDER BY r.created_at DESC';

    const [rows] = await pool.query(query, params);
    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error('getReviews error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

/* ─────────────────────────────────────────────────────────────────
   Admin: approve / reject a review
   ───────────────────────────────────────────────────────────────── */
const moderateReview = async (req, res) => {
  try {
    const { id }     = req.params;
    const { status } = req.body;

    const valid = ['pending', 'approved', 'rejected'];
    if (!valid.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    /* Auto-add status column if missing */
    const hasStatus = await reviewsHasStatus();
    if (!hasStatus) {
      await pool.query(`
        ALTER TABLE reviews
        ADD COLUMN IF NOT EXISTS
        status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending'
      `);
      _reviewsHasStatus = true;
    }

    const [result] = await pool.query(
      'UPDATE reviews SET status = ? WHERE id = ?',
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }
    return res.status(200).json({ success: true, message: `Review ${status}.` });
  } catch (err) {
    console.error('moderateReview error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

/* ─────────────────────────────────────────────────────────────────
   Customer: submit a review (one per customer per product)
   ───────────────────────────────────────────────────────────────── */
const submitReview = async (req, res) => {
  try {
    const { product_id, rating, comment } = req.body;
    const customer_id = req.user.id;

    if (!product_id || !rating) {
      return res.status(400).json({ success: false, message: 'product_id and rating are required.' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });
    }

    const [existing] = await pool.query(
      'SELECT id FROM reviews WHERE customer_id = ? AND product_id = ?',
      [customer_id, product_id]
    );
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'You have already reviewed this product.' });
    }

    const hasStatus = await reviewsHasStatus();
    const sql  = hasStatus
      ? `INSERT INTO reviews (customer_id, product_id, rating, comment, status) VALUES (?, ?, ?, ?, 'pending')`
      : `INSERT INTO reviews (customer_id, product_id, rating, comment) VALUES (?, ?, ?, ?)`;
    const vals = [customer_id, product_id, rating, comment?.trim() || null];

    const [result] = await pool.query(sql, vals);

    return res.status(201).json({
      success: true,
      message: 'Review submitted. It will appear after moderation.',
      data: { id: result.insertId },
    });
  } catch (err) {
    console.error('submitReview error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

/* ─────────────────────────────────────────────────────────────────
   Public: approved reviews + aggregate stats for a product
   ───────────────────────────────────────────────────────────────── */
const getProductReviews = async (req, res) => {
  try {
    const { product_id } = req.params;
    const hasStatus      = await reviewsHasStatus();

    const whereClause = hasStatus
      ? `WHERE r.product_id = ? AND r.status = 'approved'`
      : `WHERE r.product_id = ?`;

    const [rows] = await pool.query(
      `SELECT r.id, r.rating, r.comment, r.created_at, c.name AS customer_name
       FROM reviews r
       LEFT JOIN customers c ON c.id = r.customer_id
       ${whereClause}
       ORDER BY r.created_at DESC`,
      [product_id]
    );

    const total      = rows.length;
    const avg_rating = total > 0
      ? parseFloat((rows.reduce((s, r) => s + r.rating, 0) / total).toFixed(1))
      : 0;

    return res.status(200).json({ success: true, data: { reviews: rows, total, avg_rating } });
  } catch (err) {
    console.error('getProductReviews error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = { getReviews, moderateReview, submitReview, getProductReviews };
