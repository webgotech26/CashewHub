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
 *     TWILIO_MODE=sandbox  → Twilio sandbox number, free-form body, no template needed
 *     TWILIO_MODE=live     → Approved production number; uses Content API template
 *                            if TWILIO_CONTENT_SID is set, otherwise free-form fallback
 *
 * ── Required .env variables ──────────────────────────────────────────
 *   TWILIO_ACCOUNT_SID       — ACxxxxxxxxxxxxxxxxx
 *   TWILIO_AUTH_TOKEN        — from Twilio console
 *   TWILIO_MODE              — "sandbox" | "live"  (default: sandbox)
 *   TWILIO_WA_FROM           — whatsapp:+14155238886  (sandbox number)
 *   TWILIO_WA_FROM_LIVE      — whatsapp:+91XXXXXXXXXX (approved live number)
 *   TWILIO_WA_TO             — whatsapp:+91XXXXXXXXXX (admin's WhatsApp)
 *   TWILIO_CONTENT_SID       — HXxxxxxxxxx (optional — Content API template SID)
 *   TWILIO_CUSTOMER_SID      — HXxxxxxxxxx (optional — separate customer template SID)
 *
 * ── Production Compliance Notes ─────────────────────────────────────
 *   1. WhatsApp Business requires Meta-approved message templates for
 *      any message sent OUTSIDE the 24-hour customer service window.
 *      Always use contentSid for outbound notifications in live mode.
 *   2. Template variables must exactly match the placeholders in your
 *      approved template ({{1}}, {{2}}, etc.).
 *   3. Phone numbers must include the country code (+91 for India).
 *   4. Never log full auth tokens, PIIs, or message bodies to production logs.
 */

'use strict';

const SEP = '─────────────────────────';

/* ── Retry config ────────────────────────────────────────────────── */
const MAX_RETRIES    = 2;   // number of retries after initial failure
const RETRY_DELAY_MS = 800; // base delay between retries (doubles each attempt)

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

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

/**
 * Normalise any Indian phone number to whatsapp:+91XXXXXXXXXX
 * Accepts:
 *   "9876543210"        → whatsapp:+919876543210
 *   "+919876543210"     → whatsapp:+919876543210
 *   "919876543210"      → whatsapp:+919876543210
 *   "whatsapp:+91..."   → returned as-is
 * Returns null if the number is clearly invalid (not 10 digits after stripping).
 */
function toWhatsApp(phone) {
  if (!phone) return null;
  const s = String(phone).trim();
  if (s.startsWith('whatsapp:')) return s;

  // Strip all non-digit characters except leading +
  const cleaned = s.replace(/[\s\-().]/g, '');

  // Remove leading + and country code 91 if present
  const digits = cleaned.replace(/^\+?91/, '').replace(/^\+/, '');

  // Must be exactly 10 digits for a valid Indian mobile
  if (!/^\d{10}$/.test(digits)) {
    console.warn(`[WhatsApp] ⚠️  Invalid phone number format: "${phone}" — skipping.`);
    return null;
  }

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
    timeZone: 'Asia/Kolkata',
    day:      '2-digit',
    month:    'short',
    year:     'numeric',
    hour:     '2-digit',
    minute:   '2-digit',
    hour12:   true,
  });
}

/**
 * Send a Twilio message with automatic retry on transient errors.
 * Retries on network timeouts and Twilio 5xx errors.
 * Does NOT retry on 4xx errors (invalid number, template mismatch, etc.).
 *
 * @param {object} params — Twilio messages.create() params
 * @param {string} label  — short identifier for log lines
 */
async function sendWithRetry(params, label) {
  let lastErr;
  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    try {
      const msg = await getTwilioClient().messages.create(params);
      return msg; // success
    } catch (err) {
      lastErr = err;
      const code = err.status || err.code || 0;
      const isRetryable =
        code >= 500 || err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT';

      if (!isRetryable || attempt > MAX_RETRIES) break;

      const delay = RETRY_DELAY_MS * attempt;
      console.warn(
        `[WhatsApp] ⚠️  ${label} attempt ${attempt} failed (${err.message}). Retrying in ${delay}ms…`
      );
      await sleep(delay);
    }
  }
  throw lastErr; // re-throw after exhausting retries
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
    console.warn(
      `[WhatsApp:${mode}] Admin alert skipped — TWILIO_WA_FROM or TWILIO_WA_TO not set.`
    );
    return;
  }

  const displayId = orderData.display_id || orderData.id;

  const body = [
    `🔔 *NEW ORDER ALERT*`,
    `🌿 *Petrichor Naturals — Admin Panel*`,
    SEP,
    ``,
    `📋 *Order Details*`,
    `   🆔 Order ID    : #${displayId}`,
    `   📅 Date & Time : ${nowIST()} IST`,
    `   💳 Payment     : ${(orderData.payment_method || 'N/A').toUpperCase()}`,
    `   💰 Order Total : ₹${Number(orderData.total_amount).toLocaleString('en-IN')}`,
    ``,
    SEP,
    ``,
    `👤 *Customer Info*`,
    `   Name  : ${orderData.customer_name || `Customer #${orderData.customer_id}`}`,
    `   Phone : ${orderData.customer_phone || 'N/A'}`,
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

  const msg = await sendWithRetry(
    { from, to: adminTo, body },
    `Admin alert #${displayId}`
  );
  console.log(
    `[WhatsApp:${mode}] ✓ Admin alert sent — Order #${displayId} | SID: ${msg.sid}`
  );
}

/* ═══════════════════════════════════════════════════════════════════
   FLOW 2 — CUSTOMER CONFIRMATION
   Sandbox  → free-form body text (no template needed)
   Live     → Content API template if TWILIO_CONTENT_SID is set,
              otherwise falls back to free-form body text.

   PRODUCTION COMPLIANCE:
   WhatsApp requires a Meta-approved template for outbound messages
   outside the 24-hour customer service window. Set TWILIO_CONTENT_SID
   or TWILIO_CUSTOMER_SID with an approved template SID in live mode.
   ═══════════════════════════════════════════════════════════════════ */
async function sendCustomerWhatsApp({ to, customerName, orderData }) {
  const from   = getSender();
  const custTo = toWhatsApp(to);
  const mode   = isLiveMode() ? 'LIVE' : 'SANDBOX';

  if (!from) {
    console.warn(
      `[WhatsApp:${mode}] Customer notification skipped — sender number not configured.`
    );
    return;
  }
  if (!custTo) {
    // toWhatsApp() already logged the specific issue
    return;
  }

  const displayId      = orderData.display_id || orderData.id;
  const totalFormatted = Number(orderData.total_amount).toLocaleString('en-IN');
  const name           = customerName || 'there';

  // ── LIVE mode + Content API template (production-compliant) ──────
  // Uses TWILIO_CUSTOMER_SID if set, falls back to TWILIO_CONTENT_SID.
  const contentSid =
    process.env.TWILIO_CUSTOMER_SID || process.env.TWILIO_CONTENT_SID;

  if (isLiveMode() && contentSid) {
    /*
     * Template variables must match the placeholders in your approved template.
     * Standard 3-variable order confirmation template:
     *   {{1}} = customer first name
     *   {{2}} = order ID
     *   {{3}} = total amount (formatted)
     */
    const contentVariables = JSON.stringify({
      '1': name,
      '2': String(displayId),
      '3': totalFormatted,
    });

    const msg = await sendWithRetry(
      { from, to: custTo, contentSid, contentVariables },
      `Customer template #${displayId}`
    );
    console.log(
      `[WhatsApp:${mode}] ✓ Customer template sent — ${custTo} | Order #${displayId} | SID: ${msg.sid}`
    );
    return;
  }

  // ── Sandbox OR Live without Content SID → free-form body ─────────
  if (isLiveMode() && !contentSid) {
    console.warn(
      `[WhatsApp:LIVE] ⚠️  TWILIO_CONTENT_SID not set — sending free-form body. ` +
      `This may fail for new customers outside the 24h window. ` +
      `Set TWILIO_CONTENT_SID with an approved template for reliable delivery.`
    );
  }

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
    `Hi *${name}!* 👋`,
    `Your order has been placed successfully.`,
    `We'll pack & dispatch it soon! 🚀`,
    ``,
    SEP,
    ``,
    `📋 *Order Summary*`,
    `   🆔 Order ID    : #${displayId}`,
    `   📅 Date & Time : ${nowIST()} IST`,
    `   💳 Payment     : ${(orderData.payment_method || 'N/A').toUpperCase()}`,
    `   💰 Amount Paid : ₹${totalFormatted}`,
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

  const msg = await sendWithRetry(
    { from, to: custTo, body },
    `Customer msg #${displayId}`
  );
  console.log(
    `[WhatsApp:${mode}] ✓ Customer message sent — ${custTo} | Order #${displayId} | SID: ${msg.sid}`
  );
}

/* ── Backward-compat helper ──────────────────────────────────────── */
function formatWhatsAppNumber(phone) {
  return toWhatsApp(phone);
}

module.exports = { sendWhatsAppAlert, sendCustomerWhatsApp, formatWhatsAppNumber };
