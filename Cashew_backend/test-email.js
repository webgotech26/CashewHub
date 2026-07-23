/**
 * test-email.js
 * Quick test script for order confirmation email.
 * 
 * Usage:
 *   1. Update EMAIL_* variables in .env
 *   2. Replace 'test@example.com' with your actual email
 *   3. Run: node test-email.js
 */

require('dotenv').config();
const { sendOrderConfirmationEmail } = require('./utils/email');

const testOrder = {
  id: 999,
  total_amount: 1250,
  address: '123 Test Street, Anna Nagar, Chennai, Tamil Nadu 600040',
  payment_method: 'upi',
  items: [
    {
      product_name: 'Premium W180 Cashews (1/2kg)',
      quantity: 2,
      unit_price: 500,
      line_total: 1000,
    },
    {
      product_name: 'Roasted Cashew (1kg)',
      quantity: 1,
      unit_price: 250,
      line_total: 250,
    },
  ],
};

console.log('🚀 Sending test order confirmation email...\n');

sendOrderConfirmationEmail({
  customerEmail: 'test@example.com',  // ← CHANGE THIS to your test email
  customerName: 'Test Customer',
  orderData: testOrder,
})
  .then(() => {
    console.log('✅ Email sent successfully!');
    console.log('📧 Check your inbox at: test@example.com');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Email failed:', err.message);
    console.error('\nTroubleshooting tips:');
    console.error('1. Check EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD in .env');
    console.error('2. For Gmail, generate an App Password: https://myaccount.google.com/apppasswords');
    console.error('3. Ensure 2FA is enabled on your Google account');
    process.exit(1);
  });
