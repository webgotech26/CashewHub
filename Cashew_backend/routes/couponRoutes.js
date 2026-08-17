const express = require('express');
const router  = express.Router();
const { getCoupons, validateCoupon, createCoupon, updateCoupon, patchCoupon, deleteCoupon } = require('../controllers/couponController');
const { verifyToken, adminOnly } = require('../middleware/authMiddleware');

// Customer-facing: validate a coupon code (no admin gate)
router.post('/validate', validateCoupon);

// Admin only
router.get('/',         verifyToken, adminOnly, getCoupons);
router.post('/',        verifyToken, adminOnly, createCoupon);
router.put('/:id',      verifyToken, adminOnly, updateCoupon);
router.patch('/:id',    verifyToken, adminOnly, patchCoupon);
router.delete('/:id',   verifyToken, adminOnly, deleteCoupon);

module.exports = router;
