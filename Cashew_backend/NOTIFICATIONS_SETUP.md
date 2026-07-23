# 📧📱 Order Notifications Setup Guide

This guide explains how to configure **Email** and **WhatsApp** notifications for customer order confirmations in the H²B³ Cashew backend.

---

## 📋 Overview

When a customer places an order, the system automatically sends:

1. **Email Confirmation** → Customer's email (HTML formatted with order details)
2. **WhatsApp Confirmation** → Customer's phone number (text message with order summary)
3. **WhatsApp Admin Alert** → Admin's configured phone number (new order notification)

**All notifications use dynamic customer data from the `customers` table** — no hardcoded values.

---

## 🔧 Prerequisites

### Required npm Packages
```bash
npm install nodemailer   # Already installed ✓
npm install twilio       # Already installed ✓
```

---

## 📧 Email Configuration (Gmail SMTP)

### Step 1: Generate Gmail App Password

1. Go to your **Google Account**: https://myaccount.google.com
2. Enable **2-Factor Authentication** (if not already enabled)
3. Navigate to **App Passwords**: https://myaccount.google.com/apppasswords
4. Select **Mail** and **Other (Custom name)**, then click **Generate**
5. Copy the **16-character app password** (spaces don't matter)

### Step 2: Add to `.env` file

```env
# Email Notifications
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=youremail@gmail.com
EMAIL_PASSWORD=your16charapppassword
EMAIL_FROM="H²B³ Cashew <noreply@h2b3cashew.com>"
```

### Alternative SMTP Providers

**SendGrid:**
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=your_sendgrid_api_key
```

**Outlook/Office365:**
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=youremail@outlook.com
EMAIL_PASSWORD=your_password
```

---

## 📱 WhatsApp Configuration (Twilio)

### Step 1: Create Twilio Account

1. Sign up at: https://www.twilio.com/try-twilio
2. Verify your email and phone number
3. Navigate to the **Console Dashboard**: https://console.twilio.com

### Step 2: Get Credentials

From the Twilio Console Dashboard, copy:
- **Account SID** (starts with `AC...`)
- **Auth Token** (click "Show" to reveal)

### Step 3: Set Up WhatsApp Sender

#### Option A: Twilio Sandbox (Free for Testing)

1. Go to **Messaging → Try it out → Send a WhatsApp message**
2. Follow the instructions to send `join <your-code>` to the Twilio WhatsApp number
3. Use the sandbox number as your sender:
   ```env
   TWILIO_WA_FROM=whatsapp:+14155238886
   ```

#### Option B: Production WhatsApp Number

1. Apply for a Twilio WhatsApp Business Profile
2. Get approval and assign a phone number
3. Use your approved number:
   ```env
   TWILIO_WA_FROM=whatsapp:+19876543210
   ```

### Step 4: Add to `.env` file

```env
# WhatsApp Notifications
TWILIO_ACCOUNT_SID=AC1234567890abcdef1234567890abcd
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WA_FROM=whatsapp:+14155238886
TWILIO_WA_ADMIN_TO=whatsapp:+918220960887
```

**Important Notes:**
- `TWILIO_WA_FROM` → Your Twilio WhatsApp sender number
- `TWILIO_WA_ADMIN_TO` → Admin's phone (receives new order alerts)
- **Customer WhatsApp** → Automatically sent to `customers.mobile` column (no env var needed)

---

## 🔐 Security Best Practices

### 1. **Never Commit `.env` to Git**

The `.env` file contains sensitive credentials and should **never** be committed to version control.

**Verify `.gitignore` includes:**
```
.env
.env.local
```

### 2. **Use Environment Variables in Production**

For production deployments (Railway, Heroku, Vercel, AWS, etc.):
- Set environment variables through the platform's dashboard
- **Do not** hardcode credentials in source code
- **Do not** commit `.env` files

### 3. **Rotate Credentials Regularly**

- Regenerate Gmail App Passwords every 6 months
- Rotate Twilio Auth Tokens if compromised
- Use different credentials for dev/staging/production

---

## 🧪 Testing Notifications

### Test Email

Create a test script `test-email.js`:

```javascript
require('dotenv').config();
const { sendOrderConfirmationEmail } = require('./utils/email');

const testOrder = {
  id: 999,
  total_amount: 1250,
  address: 'Test Address, Chennai, TN 600001',
  payment_method: 'upi',
  items: [
    { product_name: 'Premium W180', quantity: 2, unit_price: 500, line_total: 1000 },
    { product_name: 'Roasted Cashew', quantity: 1, unit_price: 250, line_total: 250 },
  ],
};

sendOrderConfirmationEmail({
  customerEmail: 'test@example.com',  // Replace with your test email
  customerName: 'Test Customer',
  orderData: testOrder,
})
  .then(() => console.log('✓ Email sent successfully!'))
  .catch(err => console.error('✗ Email failed:', err.message));
```

Run: `node test-email.js`

### Test WhatsApp

Create `test-whatsapp.js`:

```javascript
require('dotenv').config();
const { sendCustomerWhatsApp } = require('./utils/whatsapp');

const testOrder = {
  id: 999,
  total_amount: 1250,
  address: 'Test Address, Chennai, TN 600001',
  payment_method: 'upi',
  items: [
    { product_name: 'Premium W180', quantity: 2, line_total: 1000 },
    { product_name: 'Roasted Cashew', quantity: 1, line_total: 250 },
  ],
};

sendCustomerWhatsApp({
  to: '+919876543210',  // Replace with your test phone (must be joined to sandbox)
  customerName: 'Test Customer',
  orderData: testOrder,
})
  .then(() => console.log('✓ WhatsApp sent successfully!'))
  .catch(err => console.error('✗ WhatsApp failed:', err.message));
```

Run: `node test-whatsapp.js`

---

## 📊 How It Works

### Order Flow with Notifications

```
1. Customer places order (POST /api/orders)
   ↓
2. Order is validated and saved to MySQL (ACID transaction)
   ↓
3. Transaction commits successfully
   ↓
4. HTTP 201 response sent to customer immediately
   ↓
5. Notifications fire asynchronously (non-blocking):
   • Fetch customer details from DB (name, email, mobile)
   • Send email to customer.email
   • Send WhatsApp to customer.mobile
   • Send admin alert to TWILIO_WA_ADMIN_TO
   ↓
6. Any notification failure is logged (order still succeeds)
```

### Customer Data Source

All customer details come from the `customers` table:

```sql
SELECT name, email, mobile FROM customers WHERE id = ?
```

**Fields used:**
- `name` → Greeting in email/WhatsApp ("Hi John!")
- `email` → Recipient for order confirmation email
- `mobile` → Recipient for order confirmation WhatsApp

---

## ⚠️ Troubleshooting

### Email Not Sending

**Error: "Invalid login: 535-5.7.8 Username and Password not accepted"**
- Solution: Generate a new **App Password** (not your regular Gmail password)
- Ensure 2FA is enabled on your Google account

**Error: "Connection timeout"**
- Check `EMAIL_PORT` is `587` (TLS) or `465` (SSL)
- Verify firewall isn't blocking SMTP

### WhatsApp Not Sending

**Error: "Unable to create record: The 'To' number +919876543210 is not a valid phone number"**
- Solution: Ensure phone format is `whatsapp:+[country code][number]`
- For testing, recipient must have joined the Twilio sandbox

**Error: "Authenticate"**
- Check `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` are correct
- Verify credentials are from https://console.twilio.com

### Customer Not Receiving Notifications

**Check customer data:**
```sql
SELECT id, name, email, mobile FROM customers WHERE id = ?;
```

- If `email` is NULL → Email notification skipped (logged as warning)
- If `mobile` is NULL → WhatsApp notification skipped (logged as warning)
- Ensure phone numbers are stored with country code: `+919876543210`

---

## 📁 File Structure

```
Cashew_backend/
├── controllers/
│   └── orderController.js       ← Integrates notifications after order creation
├── utils/
│   ├── email.js                 ← sendOrderConfirmationEmail()
│   └── whatsapp.js              ← sendCustomerWhatsApp(), sendWhatsAppAlert()
├── .env                         ← Your actual credentials (NOT committed)
├── .env.example                 ← Template with placeholders
└── NOTIFICATIONS_SETUP.md       ← This guide
```

---

## 🚀 Production Checklist

Before going live:

- [ ] Generate production Gmail App Password
- [ ] Get Twilio production WhatsApp number (not sandbox)
- [ ] Set all env vars in production platform
- [ ] Test with real customer emails/phones
- [ ] Verify `customers` table has valid `email` and `mobile` columns
- [ ] Monitor logs for notification failures
- [ ] Set up Twilio alert webhooks for delivery failures (optional)

---

## 📞 Support

**Twilio Support:** https://support.twilio.com  
**Gmail App Passwords:** https://support.google.com/accounts/answer/185833  
**Nodemailer Docs:** https://nodemailer.com/about/

---

**Last Updated:** July 22, 2026  
**Version:** 1.0.0
