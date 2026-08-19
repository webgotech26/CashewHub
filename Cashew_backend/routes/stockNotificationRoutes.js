const express = require('express');
const router  = express.Router();
const {
  registerNotification,
  getWaitlist,
} = require('../controllers/stockNotificationController');
const { verifyToken, adminOnly } = require('../middleware/authMiddleware');

/* Public — customer registers their email */
router.post('/', registerNotification);

/* Admin — view the full waitlist */
router.get('/admin', verifyToken, adminOnly, getWaitlist);

module.exports = router;
