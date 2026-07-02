const express = require('express');
const router = express.Router();
const { verifyToken, adminOnly } = require('../middleware/authMiddleware');
const { createOrder, getOrders, getOrderById, updateOrderStatus } = require('../controllers/orderController');

// All order routes require authentication
router.use(verifyToken);

// POST   /api/orders        → Place a new order (customer or admin)
router.post('/', createOrder);

// GET    /api/orders        → List orders (admin: all, customer: own)
router.get('/', getOrders);

// GET    /api/orders/:id    → Single order details
router.get('/:id', getOrderById);

// PATCH  /api/orders/:id/status → Admin-only: update order status
router.patch('/:id/status', adminOnly, updateOrderStatus);

module.exports = router;
