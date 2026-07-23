/**
 * test-whatsapp.js
 * Quick test script for customer WhatsApp notification.
 * 
 * Usage:
 *   1. Update TWILIO_* variables in .env
 *   2. For sandbox testing: Join the Twilio sandbox first by sending
 *      "join <your-code>" to the Twilio WhatsApp number
 *   3. Replace '+919876543210' with your WhatsApp number
 *   4. Run: node test-whatsapp.js
 */

require('dotenv').config();
const { sendCustomerWhatsApp } = require('./utils/whatsapp');

const testOrder = {
  id: 999,
  total_amount: 1250,
  address: '123 Test Street, Anna Nagar, Chennai, Tamil Nadu 600040',
  payment_method: 'upi',
  items: [
    {
      product_name: 'Premium W180 Cashews (1/2kg)',
      quantity: 2,
      line_total: 1000,
    },
    {
      product_name: 'Roasted Cashew (1kg)',
      quantity: 1,
      line_total: 250,
    },
  ],
};

console.log('🚀 Sending test WhatsApp notification...\n');

sendCustomerWhatsApp({
  to: '+919876543210',  // ← CHANGE THIS to your WhatsApp number (with country code)
  customerName: 'Test Customer',
  orderData: testOrder,
})
  .then(() => {
    console.log('✅ WhatsApp sent successfully!');
    console.log('📱 Check your WhatsApp: +919876543210');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ WhatsApp failed:', err.message);
    console.error('\nTroubleshooting tips:');
    console.error('1. Check TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WA_FROM in .env');
    console.error('2. For sandbox: Join by sending "join <code>" to the Twilio number');
    console.error('3. Verify phone format: +[country code][number] (e.g., +919876543210)');
    console.error('4. Get credentials from: https://console.twilio.com');
    process.exit(1);
  });
