const express = require('express');
const router  = express.Router();
const { getBanners, createBanner, updateBanner, deleteBanner } = require('../controllers/bannerController');
const { verifyToken, adminOnly } = require('../middleware/authMiddleware');

/* Public — any visitor (including the customer storefront) can fetch active banners */
router.get('/', getBanners);

/* Admin-only — write operations require authentication + admin role */
router.post('/',      verifyToken, adminOnly, createBanner);
router.put('/:id',    verifyToken, adminOnly, updateBanner);
router.delete('/:id', verifyToken, adminOnly, deleteBanner);

module.exports = router;
