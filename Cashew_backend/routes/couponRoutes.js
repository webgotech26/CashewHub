const express = require('express');
const router  = express.Router();
const { getCoupons, getActiveCoupons, validateCoupon, createCoupon, updateCoupon, patchCoupon, deleteCoupon } = require('../controllers/couponController');
const { verifyToken, adminOnly } = require('../middleware/authMiddleware');

// Customer-facing — no auth required
router.get('/active',   getActiveCoupons);   // public list of valid coupons
router.post('/validate', validateCoupon);    // validate + calculate discount

// Admin only
router.get('/',         verifyToken, adminOnly, getCoupons);
router.post('/',        verifyToken, adminOnly, createCoupon);
router.put('/:id',      verifyToken, adminOnly, updateCoupon);
router.patch('/:id',    verifyToken, adminOnly, patchCoupon);
router.delete('/:id',   verifyToken, adminOnly, deleteCoupon);

module.exports = router;
