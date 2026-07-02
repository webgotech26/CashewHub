const express = require('express');
const router  = express.Router();
const { getInvoices }            = require('../controllers/invoiceController');
const { verifyToken, adminOnly } = require('../middleware/authMiddleware');

router.get('/', verifyToken, adminOnly, getInvoices);

module.exports = router;
