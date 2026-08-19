/**
 * stockNotificationController.js
 *
 * Manages the "Notify me when back in stock" waitlist.
 *
 * Flow:
 *  1. Customer sees out-of-stock product → clicks "Notify Me" → POST /api/notify-stock
 *  2. Admin restocks product (stock > 0 via inventory/PUT) →
 *     after successful update, backend calls triggerStockNotifications(productId)
 *  3. triggerStockNotifications sends emails to all waitlisted addresses,
 *     marks them as notified, and frees the slot for future re-registration.
 */

const pool   = require('../config/db');
const nodemailer = require('nodemailer');

/* ── Email transporter ─────────────────────────────────────────── */
function getTransporter() {
  return nodemailer.createTransport({
    host:   process.env.EMAIL_HOST   || 'smtp.gmail.com',
    port:   parseInt(process.env.EMAIL_PORT, 10) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
}

/* ── Auto-create table if it doesn't exist ─────────────────────── */
async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS stock_notifications (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      product_id  INT NOT NULL,
      email       VARCHAR(150) NOT NULL,
      name        VARCHAR(100),
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      notified_at TIMESTAMP NULL,
      UNIQUE KEY uniq_prod_email (product_id, email),
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )
  `);
}

/**
 * POST /api/notify-stock
 * Public — register email for back-in-stock notification.
 * Body: { product_id, email, name? }
 */
const registerNotification = async (req, res) => {
  try {
    await ensureTable();
    const { product_id, email, name } = req.body;

    if (!product_id || !email?.trim()) {
      return res.status(400).json({ success: false, message: 'product_id and email are required.' });
    }

    /* Check if product is actually out of stock */
    const [pRows] = await pool.query(
      'SELECT id, name, stock_quantity FROM products WHERE id = ?', [product_id]
    );
    if (pRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    if (Number(pRows[0].stock_quantity) > 0) {
      return res.status(400).json({
        success: false,
        message: 'This product is already in stock! You can order it now.',
      });
    }

    /* Upsert — safe to call multiple times */
    await pool.query(
      `INSERT INTO stock_notifications (product_id, email, name, notified_at)
       VALUES (?, ?, ?, NULL)
       ON DUPLICATE KEY UPDATE name = VALUES(name), notified_at = NULL`,
      [product_id, email.trim().toLowerCase(), name?.trim() || null]
    );

    return res.status(201).json({
      success: true,
      message: `We'll email ${email.trim()} as soon as "${pRows[0].name}" is back in stock.`,
    });
  } catch (err) {
    console.error('registerNotification error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

/**
 * triggerStockNotifications — called internally when a product is restocked.
 * Sends emails to all pending waitlist entries for the product.
 */
async function triggerStockNotifications(productId) {
  try {
    await ensureTable();

    /* Get product info */
    const [pRows] = await pool.query(
      'SELECT id, name FROM products WHERE id = ?', [productId]
    );
    if (pRows.length === 0) return;
    const product = pRows[0];

    /* Get pending notifications (not yet notified) */
    const [notifications] = await pool.query(
      `SELECT id, email, name FROM stock_notifications
       WHERE product_id = ? AND notified_at IS NULL`,
      [productId]
    );

    if (notifications.length === 0) return;

    console.log(`[stockNotify] Sending ${notifications.length} restock emails for "${product.name}"`);

    const shopUrl = process.env.SHOP_URL || 'https://petrichor-naturals.vercel.app/home/shop';

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn('[stockNotify] EMAIL_USER/EMAIL_PASSWORD not set — skipping email send');
      return;
    }

    const transporter = getTransporter();
    const notifiedIds = [];

    for (const n of notifications) {
      try {
        await transporter.sendMail({
          from:    `"Petrichor Naturals" <${process.env.EMAIL_USER}>`,
          to:      n.email,
          subject: `✅ ${product.name} is back in stock!`,
          html: `
            <div style="font-family:'DM Sans',Arial,sans-serif;max-width:540px;margin:0 auto;
              background:#fff;border-radius:16px;overflow:hidden;
              box-shadow:0 4px 20px rgba(0,0,0,0.1)">
              <div style="background:linear-gradient(135deg,#1a0a00,#3d1a00);
                padding:32px 36px;text-align:center">
                <img src="https://petrichor-naturals.vercel.app/assets/logoo.png"
                  alt="Petrichor Naturals" style="height:52px;border-radius:50%;margin-bottom:12px" />
                <h1 style="color:#F5C842;font-size:22px;margin:0">Back in Stock! 🎉</h1>
              </div>
              <div style="padding:32px 36px">
                <p style="font-size:15px;color:#374151;line-height:1.7">
                  Hi${n.name ? ` ${n.name}` : ''},
                </p>
                <p style="font-size:15px;color:#374151;line-height:1.7">
                  Great news — <strong style="color:#1a0a00">${product.name}</strong>
                  is back in stock at Petrichor Naturals!
                </p>
                <div style="text-align:center;margin:28px 0">
                  <a href="${shopUrl}" style="display:inline-block;
                    background:linear-gradient(135deg,#C9972B,#F5C842);
                    color:#1a0a00;text-decoration:none;
                    padding:14px 36px;border-radius:30px;
                    font-size:15px;font-weight:800">
                    Shop Now →
                  </a>
                </div>
                <p style="font-size:12px;color:#9CA3AF;text-align:center;margin-top:24px">
                  Petrichor Naturals · Premium Natural Products<br>
                  contact.cashewhub@gmail.com
                </p>
              </div>
            </div>
          `,
        });
        notifiedIds.push(n.id);
      } catch (emailErr) {
        console.error(`[stockNotify] Failed to email ${n.email}:`, emailErr.message);
      }
    }

    /* Mark notified */
    if (notifiedIds.length > 0) {
      await pool.query(
        `UPDATE stock_notifications SET notified_at = NOW() WHERE id IN (${notifiedIds.map(() => '?').join(',')})`,
        notifiedIds
      );
      console.log(`[stockNotify] Sent ${notifiedIds.length} emails for "${product.name}"`);
    }
  } catch (err) {
    console.error('triggerStockNotifications error:', err.message);
  }
}

/**
 * GET /api/notify-stock/admin  — admin view of all pending waitlist entries
 */
const getWaitlist = async (req, res) => {
  try {
    await ensureTable();
    const [rows] = await pool.query(
      `SELECT sn.id, sn.email, sn.name, sn.created_at, sn.notified_at,
              p.name AS product_name, p.stock_quantity
       FROM stock_notifications sn
       JOIN products p ON p.id = sn.product_id
       ORDER BY sn.created_at DESC
       LIMIT 200`
    );
    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error('getWaitlist error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = { registerNotification, triggerStockNotifications, getWaitlist };
