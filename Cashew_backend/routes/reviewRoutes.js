const express = require('express');
const router  = express.Router();
const { getReviews, moderateReview } = require('../controllers/reviewController');
const { verifyToken, adminOnly }     = require('../middleware/authMiddleware');

router.get('/',      verifyToken, adminOnly, getReviews);
router.patch('/:id', verifyToken, adminOnly, moderateReview);

module.exports = router;
