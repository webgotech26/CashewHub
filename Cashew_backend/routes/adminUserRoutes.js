const express = require('express');
const router  = express.Router();
const { getAdmins, createAdmin, deleteAdmin, getAdminStats } = require('../controllers/adminUserController');
const { verifyToken, adminOnly } = require('../middleware/authMiddleware');

router.get('/stats',  verifyToken, adminOnly, getAdminStats);  // /api/admin/stats
router.get('/',       verifyToken, adminOnly, getAdmins);
router.post('/',      verifyToken, adminOnly, createAdmin);
router.delete('/:id', verifyToken, adminOnly, deleteAdmin);

module.exports = router;
