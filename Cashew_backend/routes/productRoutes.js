const express = require('express');
const router  = express.Router();

const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  deactivateProduct,
  reactivateProduct,
  uploadProductImage,
} = require('../controllers/productController');

const { verifyToken, adminOnly } = require('../middleware/authMiddleware');
const { upload }                 = require('../middleware/uploadMiddleware');

// ─── Public routes (no auth required) ───────────────────────────────────────

router.get('/', getProducts);
router.get('/:id', getProductById);

// ─── Admin-only routes ───────────────────────────────────────────────────────

// Must be defined BEFORE /:id routes to avoid param capture
router.post('/upload-image', verifyToken, adminOnly, upload.single('image'), uploadProductImage);
router.post('/add', verifyToken, adminOnly, upload.single('image'), createProduct);
router.post('/',    verifyToken, adminOnly, upload.single('image'), createProduct);

router.put('/:id',  verifyToken, adminOnly, upload.single('image'), updateProduct);

/* Safe alternatives to delete when a product has existing orders */
router.patch('/:id/deactivate',  verifyToken, adminOnly, deactivateProduct);
router.patch('/:id/reactivate',  verifyToken, adminOnly, reactivateProduct);

router.delete('/:id', verifyToken, adminOnly, deleteProduct);

module.exports = router;
