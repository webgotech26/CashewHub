const express = require('express');
const router  = express.Router();
const { getAuditLogs }           = require('../controllers/auditController');
const { verifyToken, adminOnly } = require('../middleware/authMiddleware');

router.get('/', verifyToken, adminOnly, getAuditLogs);

module.exports = router;
