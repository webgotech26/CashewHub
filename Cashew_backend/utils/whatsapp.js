/**
 * utils/whatsapp.js
 * Twilio WhatsApp notification utility for Petrichor Naturals.
 *
 * ── Two separate message flows ───────────────────────────────────────
 *   sendWhatsAppAlert(orderData)                          → ADMIN alert
 *   sendCustomerWhatsApp({ to, customerName, orderData }) → CUSTOMER confirmation
 *
 * ── Sandbox vs Live mode ─────────────────────────────────────────────
 *   Controlled by TWILIO_MODE in .env:
 *     TWILIO_MODE=sandbox  → uses Twilio sandbox number, free-form body text
 *     TWILIO_MODE=live     → uses your approved production number;
 *                            if TWILIO_CONTENT_SID is set it sends a pre-approved
 *                            Content API template, otherwise falls back to free-form
 *
 * ── Required .env variables ──────────────────────────────────────────
 *   TWILIO_ACCOUNT_SID      — ACxxxxxxxxxxxxxxxxx
 *   TWILIO_AUTH_TOKEN       — from Twilio console
 *   TWILIO_MODE             — "sandbox" | "live"  (default: sandbox)
 *   TWILIO_WA_FROM          — whatsapp:+14155238886  (sandbox number)
 *   TWILIO_WA_FROM_LIVE     — whatsapp:+91XXXXXXXXXX (approved live number)
 *   TWILIO_WA_TO            — whatsapp:+91XXXXXXXXXX (admin's WhatsApp)
 *   TWILIO_CONTENT_SID      — HXxxxxxxxxx (optional — Content API template SID)
 */

'use strict';

const SEP = '─────────────────────────';

/* ── Lazy Twilio client ──────────────────────────────────────────── */
let _client = null;

function getTwilioClient() {
  if (_client) return _client;
  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) {
    throw new Error(
      'Twilio credentials missing. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env'
    );
  }
  _client = require('twilio')(sid, token);
  return _client;
}

/* ── Mode detection ──────────────────────────────────────────────── */
function isLiveMode() {
  return (process.env.TWILIO_MODE || 'sandbox').toLowerCase() === 'live';
}

/* ── Sender number (sandbox or live) ────────────────────────────── */
function getSender() {
  const raw = isLiveMode()
    ? (process.env.TWILIO_WA_FROM_LIVE || process.env.TWILIO_WA_FROM || '')
    : (process.env.TWILIO_WA_FROM || '');
  return raw.startsWith('whatsapp:') ? raw : `whatsapp:${raw}`;
}

/* ── Normalise any phone to whatsapp:+91XXXXXXXXXX ──────────────── */
function toWhatsApp(phone) {
  if (!phone) return null;
  if (String(phone).startsWith('whatsapp:')) return phone;
  const digits = String(phone).replace(/[\s\-]/g, '').replace(/^\+?91/, '');
  return `whatsapp:+91${digits}`;
}

/* ── Format items for free-form messages ────────────────────────── */
function formatItems(items) {
  if (!items || items.length === 0) return '   (no items)';
  return items
    .map((item, idx) => {
      const name  = item.product_name || 'Item';
      const qty   = item.quantity || 1;
      const total = item.line_total
        ? `₹${Number(item.line_total).toFixed(2)}`
        : item.unit_price
          ? `₹${(Number(item.unit_price) * Number(qty)).toFixed(2)}`
          : '';
      return `   ${idx + 1}. ${name}\n      Qty: ${qty}  |  Total: ${total}`;
    })
    .join('\n');
}

/* ── IST timestamp ───────────────────────────────────────────────── */
function nowIST() {
  return new Date().toLocaleString('en-IN', {
    timeZone:  'Asia/Kolkata',
    day:       '2-digit',
    month:     'short',
    year:      'numeric',
    hour:      '2-digit',
    minute:    '2-digit',
    hour12:    true,
  });
}

/* ═══════════════════════════════════════════════════════════════════
   FLOW 1 — ADMIN ALERT
   Always free-form. Sent to TWILIO_WA_TO on every new order.
   Works in both sandbox and live mode.
   ═══════════════════════════════════════════════════════════════════ */
async function sendWhatsAppAlert(orderData) {
  const from    = getSender();
  const adminTo = process.env.TWILIO_WA_TO;
  const mode    = isLiveMode() ? 'LIVE' : 'SANDBOX';

  if (!from || !adminTo) {
    console.warn(`[WhatsApp:${mode}] Admin alert skipped — TWILIO_WA_FROM or TWILIO_WA_TO not set.`);
    return;
  }

  const body = [
    `🔔 *NEW ORDER ALERT*`,
    `🌿 *Petrichor Naturals — Admin Panel*`,
    SEP,
    ``,
    `📋 *Order Details*`,
    `   🆔 Order ID    : #${orderData.id}`,
    `   📅 Date & Time : ${nowIST()} IST`,
    `   💳 Payment     : ${(orderData.payment_method || 'N/A').toUpperCase()}`,
    `   💰 Order Total : ₹${Number(orderData.total_amount).toLocaleString('en-IN')}`,
    ``,
    SEP,
    ``,
    `👤 *Customer Info*`,
    `   Name : ${orderData.customer_name || `Customer #${orderData.customer_id}`}`,
    ``,
    SEP,
    ``,
    `🛍️ *Items Ordered*`,
    formatItems(orderData.items),
    ``,
    SEP,
    ``,
    `📍 *Delivery Address*`,
    `   ${orderData.address || 'Not provided'}`,
    ``,
    SEP,
    ``,
    `✅ Please confirm & process this order promptly.`,
    `📞 Support: +91 82209 60887`,
  ].join('\n');

  const msg = await getTwilioClient().messages.create({ from, to: adminTo, body });
  console.log(
    `[WhatsApp:${mode}] ✓ Admin alert → Order #${orderData.id} | To: ${adminTo} | SID: ${msg.sid}`
  );
}

/* ═══════════════════════════════════════════════════════════════════
   FLOW 2 — CUSTOMER CONFIRMATION
   Sandbox  → free-form body text (no template needed)
   Live     → Content API template if TWILIO_CONTENT_SID is set,
              otherwise falls back to free-form body text
   ═══════════════════════════════════════════════════════════════════ */
async function sendCustomerWhatsApp({ to, customerName, orderData }) {
  const from   = getSender();
  const custTo = toWhatsApp(to);
  const mode   = isLiveMode() ? 'LIVE' : 'SANDBOX';

  if (!from) {
    console.warn(`[WhatsApp:${mode}] Customer notification skipped — sender number not set.`);
    return;
  }
  if (!custTo) {
    console.warn(
      `[WhatsApp:${mode}] Customer notification skipped for Order #${orderData.id} — no phone.`
    );
    return;
  }

  // ── LIVE mode + Content API template ─────────────────────────────
  const contentSid = process.env.TWILIO_CONTENT_SID;

  if (isLiveMode() && contentSid) {
    /*
     * Content API (approved template) — required for live numbers when
     * messaging users who have NOT initiated a conversation in the last 24h.
     *
     * Template variables are passed as contentVariables (JSON string).
     * Adjust the variable keys to match your approved template in Twilio.
     *
     * Example template text (create in Twilio console):
     *   "Hi {{1}}, your order #{{2}} for ₹{{3}} has been confirmed! 🌰"
     */
    const contentVariables = JSON.stringify({
      '1': customerName || 'there',
      '2': String(orderData.id),
      '3': Number(orderData.total_amount).toLocaleString('en-IN'),
    });

    const msg = await getTwilioClient().messages.create({
      from,
      to:               custTo,
      contentSid,
      contentVariables,
    });

    console.log(
      `[WhatsApp:${mode}] ✓ Customer template → ${custTo} | Order #${orderData.id} | SID: ${msg.sid}`
    );
    return;
  }

  // ── Sandbox mode OR Live without Content SID → free-form body ────
  const itemSummary = (orderData.items || [])
    .map(i => {
      const qty   = i.quantity || 1;
      const total = i.line_total
        ? `₹${Number(i.line_total).toFixed(2)}`
        : i.unit_price
          ? `₹${(Number(i.unit_price) * Number(qty)).toFixed(2)}`
          : '';
      return `   • ${i.product_name || 'Item'} × ${qty}  ${total}`;
    })
    .join('\n');

  const body = [
    `✅ *ORDER CONFIRMED!*`,
    `🌿 *Petrichor Naturals*`,
    SEP,
    ``,
    `Hi *${customerName || 'there'}!* 👋`,
    `Your order has been placed successfully.`,
    `We'll pack & dispatch it soon! 🚀`,
    ``,
    SEP,
    ``,
    `📋 *Order Summary*`,
    `   🆔 Order ID    : #${orderData.id}`,
    `   📅 Date & Time : ${nowIST()} IST`,
    `   💳 Payment     : ${(orderData.payment_method || 'N/A').toUpperCase()}`,
    `   💰 Amount Paid : ₹${Number(orderData.total_amount).toLocaleString('en-IN')}`,
    ``,
    SEP,
    ``,
    `🛒 *Items in Your Order*`,
    itemSummary || '   (no items)',
    ``,
    SEP,
    ``,
    `📍 *Delivery Address*`,
    `   ${orderData.address || 'Not provided'}`,
    ``,
    SEP,
    ``,
    `📦 You'll receive a shipping update once dispatched.`,
    ``,
    `💬 *Need Help?*`,
    `   📞 Call / WhatsApp: *+91 82209 60887*`,
    `   🕘 Hours: 9 AM – 10 PM (Mon – Sat)`,
    ``,
    `Thank you for choosing Petrichor Naturals! 🌿❤️`,
  ].join('\n');

  const msg = await getTwilioClient().messages.create({ from, to: custTo, body });
  console.log(
    `[WhatsApp:${mode}] ✓ Customer msg → ${custTo} | Order #${orderData.id} | SID: ${msg.sid}`
  );
}

/* ── Backward-compat helper ──────────────────────────────────────── */
function formatWhatsAppNumber(phone) {
  if (!phone) return null;
  if (phone.startsWith('whatsapp:')) return phone;
  let digits = phone.replace(/\s+/g, '').replace(/[^\d+]/g, '');
  if (/^\d{10}$/.test(digits)) digits = '+91' + digits;
  if (!digits.startsWith('+')) digits = '+' + digits;
  return `whatsapp:${digits}`;
}

module.exports = { sendWhatsAppAlert, sendCustomerWhatsApp, formatWhatsAppNumber };
