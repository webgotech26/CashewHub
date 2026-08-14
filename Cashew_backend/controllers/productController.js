const pool = require('../config/db');

/**
 * GET /api/products
 * Public — returns paginated product list with optional search filter.
 * Joins categories table so category_name is included in each row.
 */
const getProducts = async (req, res) => {
  try {
    const page   = parseInt(req.query.page,  10) || 1;
    const limit  = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    /* ── Detect which optional columns exist on the products table ──
       is_active and unit may not exist on all deployments (Railway vs local).
       We only filter by is_active if the column actually exists.
    ──────────────────────────────────────────────────────────────── */
    const [colRows] = await pool.query(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME   = 'products'
         AND COLUMN_NAME  IN ('is_active', 'unit')`
    );
    const existingCols = new Set(colRows.map(r => r.COLUMN_NAME));
    const hasIsActive  = existingCols.has('is_active');
    const hasUnit      = existingCols.has('unit');

    let query = `
      SELECT
        p.id,
        p.category_id,
        p.name,
        p.description,
        p.price,
        p.stock_quantity,
        p.image_url,
        ${hasIsActive ? 'p.is_active,' : '1 AS is_active,'}
        ${hasUnit     ? 'p.unit,'      : "'kg' AS unit,"}
        c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
    `;

    const params  = [];
    const filters = [];

    /* Only filter by is_active if the column exists — avoids empty results
       on schemas where is_active was never added */
    if (hasIsActive) {
      filters.push('(p.is_active IS NULL OR p.is_active = 1)');
    }

    if (search) {
      filters.push('p.name LIKE ?');
      params.push(`%${search}%`);
    }

    if (filters.length > 0) {
      query += ' WHERE ' + filters.join(' AND ');
    }

    // Count total for pagination metadata (use same filters)
    const countBase = `SELECT COUNT(*) AS total FROM products p${filters.length > 0 ? ' WHERE ' + filters.join(' AND ') : ''}`;
    const [countResult] = await pool.query(countBase, params);
    const total = countResult[0].total;

    console.log(`[getProducts] total matching rows: ${total}, page: ${page}, limit: ${limit}`);

    query += ` ORDER BY
      CASE
        WHEN p.name LIKE '%Premium%' THEN 1
        WHEN p.name LIKE '%Standard%' THEN 2
        WHEN p.name LIKE '%Economy%'  THEN 3
        WHEN p.name LIKE '%Roasted%'  THEN 4
        ELSE 5
      END ASC,
      p.name ASC
      LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [rows] = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('getProducts error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

/**
 * GET /api/products/:id
 * Returns a single product by ID.
 */
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    /* Check which optional columns exist */
    const [colRows] = await pool.query(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME   = 'products'
         AND COLUMN_NAME  IN ('is_active', 'unit')`
    );
    const existingCols = new Set(colRows.map(r => r.COLUMN_NAME));
    const hasUnit = existingCols.has('unit');

    const [rows] = await pool.query(
      `SELECT
         p.id,
         p.category_id,
         p.name,
         p.description,
         p.price,
         p.stock_quantity,
         p.image_url,
         ${hasUnit ? 'p.unit,' : "'kg' AS unit,"}
         c.name AS category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    return res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('getProductById error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

/**
 * POST /api/products/add  (also accepts POST /api/products)
 * Creates a new product. Admin-only in production.
 */
const createProduct = async (req, res) => {
  try {
    const { name, description, price, stock_quantity, category_id, image_url } = req.body;

    if (!name || price === undefined || stock_quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'name, price, and stock_quantity are required.',
      });
    }

    const [result] = await pool.query(
      `INSERT INTO products (category_id, name, description, price, stock_quantity, image_url)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        category_id   || null,
        name,
        description   || null,
        price,
        stock_quantity,
        image_url     || null,
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      data: { id: result.insertId, name, price, stock_quantity, image_url },
    });
  } catch (error) {
    console.error('createProduct error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

/**
 * PUT /api/products/:id
 * Updates an existing product. Admin-only.
 */
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, stock_quantity, category_id, image_url } = req.body;

    const [result] = await pool.query(
      `UPDATE products
       SET category_id = ?, name = ?, description = ?,
           price = ?, stock_quantity = ?, image_url = ?
       WHERE id = ?`,
      [
        category_id   || null,
        name,
        description   || null,
        price,
        stock_quantity,
        image_url     || null,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    return res.status(200).json({ success: true, message: 'Product updated successfully.' });
  } catch (error) {
    console.error('updateProduct error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

/**
 * DELETE /api/products/:id
 * Deletes a product. Admin-only.
 */
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query('DELETE FROM products WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    return res.status(200).json({ success: true, message: 'Product deleted successfully.' });
  } catch (error) {
    console.error('deleteProduct error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct };
