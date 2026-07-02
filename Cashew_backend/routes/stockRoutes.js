const express = require('express');
const router  = express.Router();
const { getStock, createStockEntry } = require('../controllers/stockController');
const { verifyToken, adminOnly }     = require('../middleware/authMiddleware');

router.get('/',  verifyToken, adminOnly, getStock);
router.post('/', verifyToken, adminOnly, createStockEntry);

module.exports = router;
