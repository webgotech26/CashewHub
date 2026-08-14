const express = require('express');
const router  = express.Router();

const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
} = require('../controllers/productController');

const { verifyToken, adminOnly } = require('../middleware/authMiddleware');
const { upload }                 = require('../middleware/uploadMiddleware');

// ─── Public routes (no auth required) ───────────────────────────────────────

// GET /api/products           — list all products (used by customer catalog)
router.get('/', getProducts);

// GET /api/products/:id       — single product detail
router.get('/:id', getProductById);

// ─── Admin-only routes ───────────────────────────────────────────────────────

// POST /api/products/upload-image   — upload a single image, returns { url }
// Must be defined BEFORE /:id routes to avoid param capture
router.post(
  '/upload-image',
  verifyToken,
  adminOnly,
  upload.single('image'),
  uploadProductImage
);

// POST /api/products/add      — create product (frontend uses this endpoint)
// Also accepts multipart/form-data with an image file field
router.post('/add', verifyToken, adminOnly, upload.single('image'), createProduct);

// POST /api/products          — alternative create endpoint
router.post('/', verifyToken, adminOnly, upload.single('image'), createProduct);

// PUT /api/products/:id       — update product (accepts optional image file)
router.put('/:id', verifyToken, adminOnly, upload.single('image'), updateProduct);

// DELETE /api/products/:id    — delete product
router.delete('/:id', verifyToken, adminOnly, deleteProduct);

module.exports = router;
