const express = require('express');
const router  = express.Router();
const { getReturns, updateReturn } = require('../controllers/returnController');
const { verifyToken, adminOnly }   = require('../middleware/authMiddleware');

router.get('/',      verifyToken, adminOnly, getReturns);
router.patch('/:id', verifyToken, adminOnly, updateReturn);

module.exports = router;
