const express = require('express');
const router  = express.Router();
const { getSuppliers, createSupplier, updateSupplier, deleteSupplier } = require('../controllers/supplierController');
const { verifyToken, adminOnly } = require('../middleware/authMiddleware');

router.get('/',     verifyToken, adminOnly, getSuppliers);
router.post('/',    verifyToken, adminOnly, createSupplier);
router.put('/:id',  verifyToken, adminOnly, updateSupplier);
router.delete('/:id', verifyToken, adminOnly, deleteSupplier);

module.exports = router;
