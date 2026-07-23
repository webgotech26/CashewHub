/**
 * utils/email.js
 * Email notification utility for H²B³ Cashew — sends order confirmations to customers.
 *
 * Uses nodemailer with Gmail SMTP (or any SMTP provider).
 * Reads credentials exclusively from environment variables.
 *
 * Required .env variables:
 *   EMAIL_HOST       — SMTP host (e.g., smtp.gmail.com)
 *   EMAIL_PORT       — SMTP port (e.g., 587 for TLS)
 *   EMAIL_USER       — Your email address
 *   EMAIL_PASSWORD   — App password (not regular password!)
 *   EMAIL_FROM       — Sender email display (e.g., "H²B³ Cashew <noreply@h2b3cashew.com>")
 *
 * For Gmail:
 *   1. Enable 2FA on your Google account
 *   2. Generate an App Password: https://myaccount.google.com/apppasswords
 *   3. Use the 16-character app password as EMAIL_PASSWORD
 */

'use strict';

const nodemailer = require('nodemailer');

/**
 * Lazily initialize the transporter so the app can still boot even if
 * email credentials are missing (useful for dev/test environments).
 */
let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;

  const host = process.env.EMAIL_HOST;
  const port = process.env.EMAIL_PORT;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD;

  if (!host || !port || !user || !pass) {
    throw new Error(
      'Email SMTP credentials not configured. ' +
      'Set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, and EMAIL_PASSWORD in your .env file.'
    );
  }

  _transporter = nodemailer.createTransport({
    host,
    port: parseInt(port, 10),
    secure: parseInt(port, 10) === 465, // true for 465, false for 587
    auth: { user, pass },
  });

  return _transporter;
}

/**
 * sendOrderConfirmationEmail
 * Sends an HTML email to the customer with their order details.
 *
 * @param {object} params
 * @param {string} params.customerEmail — Recipient email address
 * @param {string} params.customerName  — Customer name (for greeting)
 * @param {object} params.orderData     — Order details
 * @param {number|string} params.orderData.id
 * @param {number} params.orderData.total_amount
 * @param {string} params.orderData.address
 * @param {string} params.orderData.payment_method
 * @param {Array} params.orderData.items — [{ product_name, quantity, unit_price, line_total }]
 *
 * @returns {Promise<void>}
 */
async function sendOrderConfirmationEmail({ customerEmail, customerName, orderData }) {
  const from = process.env.EMAIL_FROM || `"H²B³ Cashew" <${process.env.EMAIL_USER}>`;

  // Build items table rows
  const itemRows = (orderData.items || [])
    .map(
      item => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #f0f0f0;">${item.product_name || 'Product'}</td>
          <td style="padding: 12px; border-bottom: 1px solid #f0f0f0; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid #f0f0f0; text-align: right;">₹${Number(item.unit_price).toFixed(2)}</td>
          <td style="padding: 12px; border-bottom: 1px solid #f0f0f0; text-align: right; font-weight: 600;">₹${Number(item.line_total).toFixed(2)}</td>
        </tr>
      `
    )
    .join('');

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Main container -->
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #C9972B, #F5C842); padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: #1a0a00; font-size: 28px; font-weight: 800;">
                🌰 H²B³ Cashew
              </h1>
              <p style="margin: 8px 0 0; color: rgba(26,10,0,0.8); font-size: 13px; font-weight: 600; letter-spacing: 1px;">
                PREMIUM QUALITY NUTS
              </p>
            </td>
          </tr>

          <!-- Success badge -->
          <tr>
            <td style="padding: 32px 40px 20px; text-align: center;">
              <div style="display: inline-block; background: #DCFCE7; border: 2px solid #22C55E; border-radius: 50px; padding: 10px 24px;">
                <span style="color: #15803D; font-size: 14px; font-weight: 700;">✓ ORDER CONFIRMED</span>
              </div>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <h2 style="margin: 0 0 12px; color: #1a1a1a; font-size: 22px; font-weight: 700; text-align: center;">
                Thank you, ${customerName || 'Valued Customer'}! 🎉
              </h2>
              <p style="margin: 0; color: #6b7280; font-size: 15px; line-height: 1.6; text-align: center;">
                Your order has been successfully placed and is being processed. We'll notify you once it ships.
              </p>
            </td>
          </tr>

          <!-- Order summary box -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background: #fafafa; border: 1px solid #e5e5e5; border-radius: 8px; overflow: hidden;">
                <tr>
                  <td style="padding: 16px 20px; border-bottom: 1px solid #e5e5e5;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <span style="color: #6b7280; font-size: 13px;">Order ID</span><br>
                          <span style="color: #1a1a1a; font-size: 16px; font-weight: 700;">#${orderData.id}</span>
                        </td>
                        <td align="right">
                          <span style="color: #6b7280; font-size: 13px;">Payment Method</span><br>
                          <span style="color: #1a1a1a; font-size: 14px; font-weight: 600;">${(orderData.payment_method || 'N/A').toUpperCase()}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 20px;">
                    <span style="color: #6b7280; font-size: 13px;">Delivery Address</span><br>
                    <span style="color: #1a1a1a; font-size: 14px; line-height: 1.6;">${orderData.address || 'Not provided'}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Order items table -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <h3 style="margin: 0 0 16px; color: #1a1a1a; font-size: 16px; font-weight: 700;">Order Items</h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e5e5; border-radius: 8px; overflow: hidden;">
                <thead>
                  <tr style="background: #f9fafb;">
                    <th style="padding: 12px; text-align: left; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Product</th>
                    <th style="padding: 12px; text-align: center; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Qty</th>
                    <th style="padding: 12px; text-align: right; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Price</th>
                    <th style="padding: 12px; text-align: right; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemRows}
                </tbody>
                <tfoot>
                  <tr style="background: #fafafa;">
                    <td colspan="3" style="padding: 16px; text-align: right; font-size: 16px; font-weight: 700; color: #1a1a1a;">Grand Total:</td>
                    <td style="padding: 16px; text-align: right; font-size: 18px; font-weight: 800; color: #C9972B;">₹${Number(orderData.total_amount).toLocaleString('en-IN')}</td>
                  </tr>
                </tfoot>
              </table>
            </td>
          </tr>

          <!-- Support section -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <div style="background: #fef9f3; border-left: 4px solid #F5C842; padding: 16px 20px; border-radius: 6px;">
                <p style="margin: 0 0 8px; color: #92400E; font-size: 14px; font-weight: 700;">Need Help?</p>
                <p style="margin: 0; color: #78350F; font-size: 13px; line-height: 1.6;">
                  Contact us at <a href="mailto:h2b3@gmail.com" style="color: #C9972B; text-decoration: none; font-weight: 600;">h2b3@gmail.com</a> or call 
                  <a href="tel:+918220960887" style="color: #C9972B; text-decoration: none; font-weight: 600;">+91 82209 60887</a>
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #1a1a1a; padding: 24px 40px; text-align: center;">
              <p style="margin: 0 0 8px; color: rgba(255,255,255,0.8); font-size: 13px;">
                Thank you for choosing H²B³ Cashew
              </p>
              <p style="margin: 0; color: rgba(255,255,255,0.5); font-size: 11px;">
                Panruti, Tamil Nadu · Fresh from our farms to your door
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const mailOptions = {
    from,
    to: customerEmail,
    subject: `Order Confirmation #${orderData.id} — H²B³ Cashew`,
    html: htmlBody,
  };

  const transporter = getTransporter();
  const info = await transporter.sendMail(mailOptions);

  console.log(`[Email] Order confirmation sent to ${customerEmail} — MessageID: ${info.messageId}`);
}

module.exports = { sendOrderConfirmationEmail };
