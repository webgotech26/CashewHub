/**
 * utils/whatsapp.js
 * Twilio WhatsApp notification utility for H²B³ Cashew.
 *
 * Two separate flows:
 *   sendWhatsAppAlert(orderData)                          → ADMIN order alert
 *   sendCustomerWhatsApp({ to, customerName, orderData }) → CUSTOMER confirmation
 *
 * Required .env variables:
 *   TWILIO_ACCOUNT_SID  — ACxxxxxxxxxxxxxxxxx
 *   TWILIO_AUTH_TOKEN   — from Twilio console
 *   TWILIO_WA_FROM      — whatsapp:+14155238886  (sandbox / approved sender)
 *   TWILIO_WA_TO        — whatsapp:+91XXXXXXXXXX (admin's WhatsApp)
 */

'use strict';

const SEP = '─────────────────────────';   // clean separator line

/* ── Lazy Twilio client ──────────────────────────────────────────── */
let _client = null;

function getTwilioClient() {
  if (_client) return _client;
  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) {
    throw new Error('Twilio credentials missing. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env');
  }
  _client = require('twilio')(sid, token);
  return _client;
}

/* ── Shared sender number ────────────────────────────────────────── */
function getSender() {
  const raw = process.env.TWILIO_WA_FROM || '';
  return raw.startsWith('whatsapp:') ? raw : `whatsapp:${raw}`;
}

/* ── Format items list ───────────────────────────────────────────── */
function formatItems(items) {
  if (!items || items.length === 0) return '   (no items)';
  return items
    .map((item, idx) => {
      const name  = item.product_name || 'Item';
      const qty   = item.quantity  || 1;
      const total = item.line_total
        ? `₹${Number(item.line_total).toFixed(2)}`
        : item.unit_price
          ? `₹${(Number(item.unit_price) * Number(qty)).toFixed(2)}`
          : '';
      return `   ${idx + 1}. ${name}\n      Qty: ${qty}  |  Total: ${total}`;
    })
    .join('\n');
}

/* ═══════════════════════════════════════════════════════════════════
   FLOW 1 — ADMIN ALERT
   Sent to TWILIO_WA_TO on every new order.
   ═══════════════════════════════════════════════════════════════════ */
async function sendWhatsAppAlert(orderData) {
  const from    = getSender();
  const adminTo = process.env.TWILIO_WA_TO;

  if (!from || !adminTo) {
    console.warn('[WhatsApp] Admin alert skipped — TWILIO_WA_FROM or TWILIO_WA_TO not set.');
    return;
  }

  const now = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });

  const body = [
    `🔔 *NEW ORDER ALERT*`,
    `🌰 *H²B³ Cashew — Admin Panel*`,
    SEP,
    ``,
    `📋 *Order Details*`,
    `   🆔 Order ID    : #${orderData.id}`,
    `   📅 Date & Time : ${now} IST`,
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
  console.log(`[WhatsApp] ✓ Admin alert sent → Order #${orderData.id} | SID: ${msg.sid}`);
}

/* ═══════════════════════════════════════════════════════════════════
   FLOW 2 — CUSTOMER CONFIRMATION
   Sent dynamically to the customer's own phone number.
   ═══════════════════════════════════════════════════════════════════ */
async function sendCustomerWhatsApp({ to, customerName, orderData }) {
  const from = getSender();

  if (!from) {
    console.warn('[WhatsApp] Customer notification skipped — TWILIO_WA_FROM not set.');
    return;
  }
  if (!to) {
    console.warn(`[WhatsApp] Customer notification skipped for Order #${orderData.id} — no phone.`);
    return;
  }

  // Normalise to whatsapp:+91XXXXXXXXXX
  const digits = String(to).replace(/[\s\-]/g, '').replace(/^\+?91/, '');
  const custTo = `whatsapp:+91${digits}`;

  const now = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });

  const body = [
    `✅ *ORDER CONFIRMED!*`,
    `🌰 *H²B³ Cashew*`,
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
    `   📅 Date & Time : ${now} IST`,
    `   💳 Payment     : ${(orderData.payment_method || 'N/A').toUpperCase()}`,
    `   💰 Amount Paid : ₹${Number(orderData.total_amount).toLocaleString('en-IN')}`,
    ``,
    SEP,
    ``,
    `🛒 *Items in Your Order*`,
    formatItems(orderData.items),
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
    `Thank you for choosing H²B³ Cashew! 🌰❤️`,
  ].join('\n');

  const msg = await getTwilioClient().messages.create({ from, to: custTo, body });
  console.log(`[WhatsApp] ✓ Customer msg sent → ${custTo} | Order #${orderData.id} | SID: ${msg.sid}`);
}

/* ── Backward-compat helper (used in test-whatsapp.js) ──────────── */
function formatWhatsAppNumber(phone) {
  if (!phone) return null;
  if (phone.startsWith('whatsapp:')) return phone;
  let digits = phone.replace(/\s+/g, '').replace(/[^\d+]/g, '');
  if (/^\d{10}$/.test(digits)) digits = '+91' + digits;
  if (!digits.startsWith('+')) digits = '+' + digits;
  return `whatsapp:${digits}`;
}

module.exports = { sendWhatsAppAlert, sendCustomerWhatsApp, formatWhatsAppNumber };
