const express = require('express');
const router = express.Router();
const { verifyToken, adminOnly } = require('../middleware/authMiddleware');
const { createOrder, getOrders, getOrderById, updateOrderStatus } = require('../controllers/orderController');
const { generateManifest } = require('../controllers/manifestController');

// All order routes require authentication
router.use(verifyToken);

// Disable caching on all order routes — ensures fresh data every request
router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.set('Pragma', 'no-cache');
  next();
});

// POST   /api/orders        → Place a new order (customer or admin)
router.post('/', createOrder);

// GET    /api/orders        → List orders (admin: all, customer: own)
router.get('/', getOrders);

// GET    /api/orders/manifest → Admin: print-ready dispatch manifest
// Query params: ?ids=1,2,3  (specific orders) OR ?date=today (today's orders)
router.get('/manifest', adminOnly, generateManifest);

// GET    /api/orders/:id    → Single order details
router.get('/:id', getOrderById);

// PATCH  /api/orders/:id/status → Admin-only: update order status
router.patch('/:id/status', adminOnly, updateOrderStatus);

module.exports = router;
