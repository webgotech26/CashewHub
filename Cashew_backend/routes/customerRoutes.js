const express = require('express');
const router  = express.Router();
const { getCustomers } = require('../controllers/customerController');
const { verifyToken, adminOnly } = require('../middleware/authMiddleware');

router.get('/', verifyToken, adminOnly, getCustomers);

module.exports = router;
