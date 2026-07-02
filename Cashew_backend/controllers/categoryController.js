const pool = require('../config/db');

/**
 * GET /api/categories
 * Public — returns all active categories.
 */
const getCategories = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name FROM categories ORDER BY name ASC'
    );

    return res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error('getCategories error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

/**
 * GET /api/categories/:id
 * Public — returns a single category by ID.
 */
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      'SELECT id, name FROM categories WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    return res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('getCategoryById error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

/**
 * POST /api/categories
 * Admin-only — creates a new category.
 */
const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    const [result] = await pool.query(
      'INSERT INTO categories (name, description) VALUES (?, ?)',
      [name, description || null]
    );

    return res.status(201).json({
      success: true,
      message: 'Category created.',
      data: { id: result.insertId, name, description: description || null },
    });
  } catch (error) {
    console.error('createCategory error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

/**
 * PUT /api/categories/:id
 * Admin-only — updates a category.
 */
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const [result] = await pool.query(
      'UPDATE categories SET name = ?, description = ? WHERE id = ?',
      [name, description || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    return res.status(200).json({ success: true, message: 'Category updated.' });
  } catch (error) {
    console.error('updateCategory error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

/**
 * DELETE /api/categories/:id
 * Admin-only — deletes a category.
 */
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query('DELETE FROM categories WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    return res.status(200).json({ success: true, message: 'Category deleted.' });
  } catch (error) {
    console.error('deleteCategory error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = { getCategories, getCategoryById, createCategory, updateCategory, deleteCategory };
