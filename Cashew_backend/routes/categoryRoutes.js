const express = require('express');
const router  = express.Router();

const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');

const { verifyToken, adminOnly } = require('../middleware/authMiddleware');

// ─── Public routes ────────────────────────────────────────────────────────────

// GET /api/categories         — list all categories (used by product catalog & forms)
router.get('/', getCategories);

// GET /api/categories/:id     — single category
router.get('/:id', getCategoryById);

// ─── Admin-only routes ────────────────────────────────────────────────────────

// POST /api/categories        — create
router.post('/', verifyToken, adminOnly, createCategory);

// PUT /api/categories/:id     — update
router.put('/:id', verifyToken, adminOnly, updateCategory);

// DELETE /api/categories/:id  — delete
router.delete('/:id', verifyToken, adminOnly, deleteCategory);

module.exports = router;
