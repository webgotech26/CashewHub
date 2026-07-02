const express = require('express');
const router  = express.Router();

const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');

const { verifyToken, adminOnly } = require('../middleware/authMiddleware');

// ─── Public routes (no auth required) ───────────────────────────────────────

// GET /api/products           — list all products (used by customer catalog)
router.get('/', getProducts);

// GET /api/products/:id       — single product detail
router.get('/:id', getProductById);

// ─── Admin-only routes ───────────────────────────────────────────────────────

// POST /api/products/add      — create product (frontend uses this endpoint)
router.post('/add', verifyToken, adminOnly, createProduct);

// POST /api/products          — alternative create endpoint
router.post('/', verifyToken, adminOnly, createProduct);

// PUT /api/products/:id       — update product
router.put('/:id', verifyToken, adminOnly, updateProduct);

// DELETE /api/products/:id    — delete product
router.delete('/:id', verifyToken, adminOnly, deleteProduct);

module.exports = router;
