const express = require('express');
const router  = express.Router();
const { getSalesReport }         = require('../controllers/reportController');
const { verifyToken, adminOnly } = require('../middleware/authMiddleware');

router.get('/sales', verifyToken, adminOnly, getSalesReport);

module.exports = router;
