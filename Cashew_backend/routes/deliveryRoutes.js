const express = require('express');
const router  = express.Router();
const { getDeliveries, updateDeliveryStatus, verifyOtp } = require('../controllers/deliveryController');
const { verifyToken, adminOnly } = require('../middleware/authMiddleware');

router.get('/',               verifyToken, adminOnly, getDeliveries);
router.patch('/:id/status',   verifyToken, adminOnly, updateDeliveryStatus);
router.post('/:id/verify-otp', verifyToken, adminOnly, verifyOtp);

module.exports = router;
