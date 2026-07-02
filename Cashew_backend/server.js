require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');

// Database connection (triggers pool creation + verification)
require('./config/db');

// Socket.io utility
const socket = require('./utils/socket');

// Import routes
const authRoutes     = require('./routes/authRoutes');
const orderRoutes    = require('./routes/orderRoutes');
const productRoutes  = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const stockRoutes    = require('./routes/stockRoutes');
const customerRoutes = require('./routes/customerRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const returnRoutes   = require('./routes/returnRoutes');
const couponRoutes   = require('./routes/couponRoutes');
const bannerRoutes   = require('./routes/bannerRoutes');
const reviewRoutes   = require('./routes/reviewRoutes');
const invoiceRoutes  = require('./routes/invoiceRoutes');
const reportRoutes   = require('./routes/reportRoutes');
const auditRoutes    = require('./routes/auditRoutes');
const adminRoutes    = require('./routes/adminUserRoutes');

// Initialize Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Initialize Socket.io with the HTTP server
const io = socket.init(server);

// ─── MIDDLEWARE ──────────────────────────────────────────────────────────────

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── ROUTES ──────────────────────────────────────────────────────────────────

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Cashew Backend API is running.',
    timestamp: new Date().toISOString(),
  });
});

// Auth routes (register + login for admins and customers)
app.use('/api/auth',       authRoutes);

// Category routes (public GET, admin-only writes)
app.use('/api/categories', categoryRoutes);

// Product routes (public GET, admin-only writes)
app.use('/api/products',   productRoutes);

// Order routes (protected by JWT)
app.use('/api/orders',     orderRoutes);

// Stock management
app.use('/api/stock',      stockRoutes);

// Customer list (admin only)
app.use('/api/customers',  customerRoutes);

// Supplier management
app.use('/api/suppliers',  supplierRoutes);

// Purchase management (auto-increments stock)
app.use('/api/purchases',  purchaseRoutes);

// Delivery & OTP tracking
app.use('/api/delivery',   deliveryRoutes);

// Returns & refunds
app.use('/api/returns',    returnRoutes);

// Coupons
app.use('/api/coupons',    couponRoutes);

// Banners / CMS
app.use('/api/banners',    bannerRoutes);

// Reviews moderation
app.use('/api/reviews',    reviewRoutes);

// GST Invoices
app.use('/api/invoices',   invoiceRoutes);

// Sales reports
app.use('/api/reports',    reportRoutes);

// Audit logs
app.use('/api/audit-logs', auditRoutes);

// Admin user management + dashboard stats
app.use('/api/admins',     adminRoutes);
app.use('/api/admin',      adminRoutes);  // /api/admin/stats alias

// ─── 404 HANDLER ─────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ─── GLOBAL ERROR HANDLER ────────────────────────────────────────────────────

app.use((err, req, res, next) => {
  console.error('🔥 Error:', err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ─── START SERVER ────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Cashew Backend running on port ${PORT} [${process.env.NODE_ENV}]`);
  console.log(`📡 Socket.io listening for real-time connections`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received. Shutting down gracefully...');
  server.close(() => process.exit(0));
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err.message);
  server.close(() => process.exit(1));
});

module.exports = { app, server, io };
