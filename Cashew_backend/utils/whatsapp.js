/**
 * utils/whatsapp.js
 * Twilio WhatsApp notification utility for H²B³ Cashew.
 *
 * Reads credentials exclusively from environment variables — never
 * hard-codes credentials in source code.
 *
 * Exports:
 *   sendWhatsAppAlert(orderData)               — Notifies the ADMIN on new order
 *   sendCustomerWhatsApp({ to, orderData, customerName }) — Notifies the CUSTOMER
 *
 * Required .env variables:
 *   TWILIO_ACCOUNT_SID   — e.g. ACxxxxxxxxxxxxxxxxx
 *   TWILIO_AUTH_TOKEN    — from Twilio dashboard
 *   TWILIO_WA_FROM       — whatsapp:+16506400496  (your Twilio sender number)
 *   TWILIO_WA_ADMIN_TO   — whatsapp:+91XXXXXXXXXX (admin's WhatsApp number)
 */

'use strict';

/**
 * Lazily initialise the Twilio client so the app can still boot even if
 * Twilio env vars are missing (useful in CI / test environments).
 */
let _client = null;

function getTwilioClient() {
  if (_client) return _client;

  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;

  if (!sid || !token) {
    throw new Error(
      'Twilio credentials not configured. ' +
      'Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in your .env file.'
    );
  }

  _client = require('twilio')(sid, token);
  return _client;
}

/**
 * Format a phone number to WhatsApp format.
 * Accepts: '+919876543210', '09876543210', '9876543210', '+91 98765 43210'
 * Returns: 'whatsapp:+91XXXXXXXXXX'
 */
function formatWhatsAppNumber(phone) {
  if (!phone) return null;

  // Already formatted
  if (phone.startsWith('whatsapp:')) return phone;

  // Strip all non-digit chars except leading +
  let digits = phone.replace(/\s+/g, '').replace(/[^\d+]/g, '');

  // Add country code +91 if it's a bare 10-digit Indian number
  if (/^\d{10}$/.test(digits)) {
    digits = '+91' + digits;
  }

  // Ensure there's a + prefix
  if (!digits.startsWith('+')) {
    digits = '+' + digits;
  }

  return `whatsapp:${digits}`;
}

/* ─────────────────────────────────────────────────────────────────
   ADMIN alert — fires on every new order
   ──────────────────────────────────────────────────────────────── */
/**
 * sendWhatsAppAlert
 * Sends a WhatsApp notification to the ADMIN after a new order is placed.
 *
 * @param {object} orderData
 * @param {number|string} orderData.id
 * @param {number}        orderData.total_amount
 * @param {string}        orderData.address
 * @param {string}        orderData.payment_method
 * @param {Array}         orderData.items — [{ product_name, quantity }]
 * @param {string}        [orderData.customer_name]
 *
 * @returns {Promise<void>}
 */
async function sendWhatsAppAlert(orderData) {
  const from    = process.env.TWILIO_WA_FROM;
  const adminTo = process.env.TWILIO_WA_ADMIN_TO || process.env.TWILIO_WA_TO;

  if (!from || !adminTo) {
    console.warn('[WhatsApp] Admin alert skipped — TWILIO_WA_FROM or TWILIO_WA_ADMIN_TO not set.');
    return;
  }

  const itemLines = (orderData.items || [])
    .map(i => `  • ${i.product_name || 'Item'} × ${i.quantity}`)
    .join('\n');

  const body = [
    `🛒 *New Order — H²B³ Cashew*`,
    ``,
    `📦 *Order ID:* #${orderData.id}`,
    `👤 *Customer:* ${orderData.customer_name || `ID ${orderData.customer_id}`}`,
    `💳 *Payment:* ${(orderData.payment_method || 'N/A').toUpperCase()}`,
    `💰 *Total:* ₹${Number(orderData.total_amount).toLocaleString('en-IN')}`,
    ``,
    `*Items:*`,
    itemLines || '  (no items)',
    ``,
    `📍 *Address:*`,
    `  ${orderData.address || 'Not provided'}`,
    ``,
    `⏰ ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`,
  ].join('\n');

  const client  = getTwilioClient();
  const message = await client.messages.create({ from, to: adminTo, body });

  console.log(`[WhatsApp] Admin alert sent for Order #${orderData.id} — SID: ${message.sid}`);
}

/* ─────────────────────────────────────────────────────────────────
   CUSTOMER notification — fires on every new order
   ──────────────────────────────────────────────────────────────── */
/**
 * sendCustomerWhatsApp
 * Sends an order confirmation WhatsApp message to the CUSTOMER.
 *
 * @param {object} params
 * @param {string} params.to           — Customer's 10-digit mobile number (from DB)
 * @param {string} params.customerName — Customer's name for personalised greeting
 * @param {object} params.orderData
 * @param {number|string} params.orderData.id
 * @param {number}        params.orderData.total_amount
 * @param {string}        params.orderData.address
 * @param {string}        params.orderData.payment_method
 * @param {Array}         params.orderData.items — [{ product_name, quantity, line_total }]
 *
 * @returns {Promise<void>}
 */
async function sendCustomerWhatsApp({ to, customerName, orderData }) {
  // Sandbox sender — fixed to Twilio WhatsApp sandbox number
  const from = 'whatsapp:+14155238886';

  // Guard — phone number must be present
  if (!to) {
    console.warn('[WhatsApp] Customer notification skipped — no phone number provided.');
    return;
  }

  // Strip spaces/dashes, then compose the recipient in whatsapp:+91XXXXXXXXXX format.
  // Handles both bare 10-digit ("9876543210") and already-prefixed ("+919876543210") inputs.
  const digits = String(to).replace(/[\s\-]/g, '').replace(/^\+91/, '');
  const customerTo = `whatsapp:+91${digits}`;

  // Build a neat items list
  const itemLines = (orderData.items || [])
    .map(
      (i, idx) =>
        `  ${idx + 1}. ${i.product_name || 'Item'} × ${i.quantity}` +
        (i.line_total ? ` — ₹${Number(i.line_total).toFixed(2)}` : '')
    )
    .join('\n');

  // Compose the message body
  const body = [
    `✅ *Order Confirmed! — H²B³ Cashew*`,
    ``,
    `Hi ${customerName || 'there'}! 🌰 Your order has been placed successfully.`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `📦 *Order ID:*    #${orderData.id}`,
    `💰 *Total Paid:*  ₹${Number(orderData.total_amount).toLocaleString('en-IN')}`,
    `💳 *Payment:*     ${(orderData.payment_method || 'N/A').toUpperCase()}`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `🛒 *Items Ordered:*`,
    itemLines || '  (no items)',
    ``,
    `📍 *Delivery Address:*`,
    `  ${orderData.address || 'Not provided'}`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `We'll notify you once your order is shipped! 🚚`,
    ``,
    `Need help? Call or WhatsApp us:`,
    `📞 *+91 82209 60887*`,
    ``,
    `Thank you for shopping with H²B³ Cashew! 🌰`,
  ].join('\n');

  const client  = getTwilioClient();
  const message = await client.messages.create({ from, to: customerTo, body });

  console.log(
    `[WhatsApp] Customer confirmation sent to ${customerTo} for Order #${orderData.id} — SID: ${message.sid}`
  );
}

module.exports = { sendWhatsAppAlert, sendCustomerWhatsApp, formatWhatsAppNumber };
