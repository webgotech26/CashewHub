const express = require('express');
const router  = express.Router();
const { getBanners, createBanner, updateBanner, deleteBanner } = require('../controllers/bannerController');
const { verifyToken, adminOnly } = require('../middleware/authMiddleware');

router.get('/',       verifyToken, adminOnly, getBanners);
router.post('/',      verifyToken, adminOnly, createBanner);
router.put('/:id',    verifyToken, adminOnly, updateBanner);
router.delete('/:id', verifyToken, adminOnly, deleteBanner);

module.exports = router;
