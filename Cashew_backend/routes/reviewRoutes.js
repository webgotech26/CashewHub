const express = require('express');
const router  = express.Router();
const { getReviews, moderateReview, submitReview, getProductReviews, getAllRatingsSummary } = require('../controllers/reviewController');
const { verifyToken, adminOnly } = require('../middleware/authMiddleware');

// Public: bulk ratings map for all products (used by ProductCard)
router.get('/ratings-summary', getAllRatingsSummary);

// Public: get approved reviews + stats for a product
router.get('/product/:product_id', getProductReviews);

// Customer: submit a review (must be logged in)
router.post('/', verifyToken, submitReview);

// Admin only
router.get('/',      verifyToken, adminOnly, getReviews);
router.patch('/:id', verifyToken, adminOnly, moderateReview);

module.exports = router;
