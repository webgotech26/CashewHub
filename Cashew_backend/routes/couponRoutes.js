const express = require('express');
const router  = express.Router();
const { getCoupons, createCoupon, updateCoupon, patchCoupon } = require('../controllers/couponController');
const { verifyToken, adminOnly } = require('../middleware/authMiddleware');

router.get('/',      verifyToken, adminOnly, getCoupons);
router.post('/',     verifyToken, adminOnly, createCoupon);
router.put('/:id',   verifyToken, adminOnly, updateCoupon);
router.patch('/:id', verifyToken, adminOnly, patchCoupon);

module.exports = router;
