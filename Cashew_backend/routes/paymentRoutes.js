'use strict';

const express = require('express');
const router  = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { createRazorpayOrder, verifyPayment } = require('../controllers/razorpayController');

// POST /api/payment/create-order — authenticated customers only
router.post('/create-order', verifyToken, createRazorpayOrder);

// POST /api/payment/verify — authenticated customers only
router.post('/verify', verifyToken, verifyPayment);

module.exports = router;
