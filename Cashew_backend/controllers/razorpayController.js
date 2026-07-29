'use strict';

/**
 * controllers/razorpayController.js
 *
 * Handles Razorpay Standard Checkout:
 *   POST /api/payment/create-order  — creates a Razorpay order
 *   POST /api/payment/verify        — verifies payment signature (HMAC-SHA256)
 *
 * Credentials are read exclusively from environment variables:
 *   RAZORPAY_KEY_ID
 *   RAZORPAY_KEY_SECRET
 */

const crypto   = require('crypto');
const Razorpay = require('razorpay');

/* ── Lazy Razorpay instance ─────────────────────────────────────── */
let _rzp = null;

function getRazorpay() {
  if (_rzp) return _rzp;

  const key_id     = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new Error(
      'Razorpay credentials missing. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env'
    );
  }

  _rzp = new Razorpay({ key_id, key_secret });
  return _rzp;
}

/* ═══════════════════════════════════════════════════════════════════
   POST /api/payment/create-order
   Body: { amount: <number in paise>, currency: 'INR', receipt: '...' }
   Returns: Razorpay order object { id, amount, currency, receipt, ... }
   ═══════════════════════════════════════════════════════════════════ */
const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;

    // amount must be a positive integer in paise (min ₹1 = 100 paise)
    const amountPaise = Math.round(Number(amount));

    if (!amountPaise || amountPaise < 100) {
      return res.status(400).json({
        success: false,
        message: 'amount must be at least 100 paise (₹1).',
      });
    }

    const options = {
      amount:   amountPaise,
      currency: currency.toUpperCase(),
      receipt:  receipt || `rcpt_${Date.now()}`,
      payment_capture: 1,   // auto-capture
    };

    const order = await getRazorpay().orders.create(options);

    return res.status(201).json({
      success:  true,
      key:      process.env.RAZORPAY_KEY_ID,   // safe to send — public key
      order_id: order.id,
      amount:   order.amount,
      currency: order.currency,
    });
  } catch (err) {
    console.error('[Razorpay] createOrder error:', err.message);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to create Razorpay order.',
    });
  }
};

/* ═══════════════════════════════════════════════════════════════════
   POST /api/payment/verify
   Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
   Verifies HMAC-SHA256: SHA256(order_id + "|" + payment_id, KEY_SECRET)
   ═══════════════════════════════════════════════════════════════════ */
const verifyPayment = (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'razorpay_order_id, razorpay_payment_id and razorpay_signature are required.',
      });
    }

    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_secret) {
      return res.status(500).json({
        success: false,
        message: 'RAZORPAY_KEY_SECRET not configured.',
      });
    }

    // HMAC-SHA256 of "order_id|payment_id" using KEY_SECRET
    const body      = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected  = crypto
      .createHmac('sha256', key_secret)
      .update(body)
      .digest('hex');

    // Constant-time comparison prevents timing attacks
    const sigBuffer  = Buffer.from(razorpay_signature, 'hex');
    const expBuffer  = Buffer.from(expected,            'hex');
    const isValid    = sigBuffer.length === expBuffer.length &&
                       crypto.timingSafeEqual(sigBuffer, expBuffer);

    if (!isValid) {
      console.warn('[Razorpay] Signature verification FAILED for order:', razorpay_order_id);
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed. Invalid signature.',
      });
    }

    console.log(`[Razorpay] ✓ Payment verified — Order: ${razorpay_order_id} | Payment: ${razorpay_payment_id}`);

    return res.status(200).json({
      success:            true,
      message:            'Payment verified successfully.',
      razorpay_order_id,
      razorpay_payment_id,
    });
  } catch (err) {
    console.error('[Razorpay] verifyPayment error:', err.message);
    return res.status(500).json({
      success: false,
      message: err.message || 'Payment verification error.',
    });
  }
};

module.exports = { createRazorpayOrder, verifyPayment };
