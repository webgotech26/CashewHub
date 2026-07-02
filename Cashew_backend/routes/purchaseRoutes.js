const express = require('express');
const router  = express.Router();
const { getPurchases, createPurchase } = require('../controllers/purchaseController');
const { verifyToken, adminOnly }       = require('../middleware/authMiddleware');

router.get('/',  verifyToken, adminOnly, getPurchases);
router.post('/', verifyToken, adminOnly, createPurchase);

module.exports = router;
