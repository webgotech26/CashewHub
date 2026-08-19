const pool = require('../config/db');
const { getImageUrl } = require('../middleware/uploadMiddleware');
const { triggerStockNotifications } = require('./stockNotificationController');

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

    /* ── is_active filter ─────────────────────────────────────────
       Customer shop: only show active products (is_active = 1 or NULL)
       Admin panel:   show ALL products including deactivated ones

       Detection: admin requests send ?admin=true OR req.user.role === 'admin'
       (verifyToken sets req.user when a valid JWT is present)
    ─────────────────────────────────────────────────────────────── */
    const isAdminRequest =
      req.query.admin === 'true' ||
      (req.user && (req.user.role === 'admin' || req.user.role === 'manager' || req.user.role === 'staff'));

    if (hasIsActive && !isAdminRequest) {
      /* Customer-facing: hide inactive products */
      filters.push('(p.is_active IS NULL OR p.is_active = 1)');
    }
    /* Admin: no is_active filter — all products visible */

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
 * POST /api/products/upload-image
 * Admin-only — upload an image and return its URL without creating a product.
 * Useful for the "preview before submit" flow in the admin form.
 */
const uploadProductImage = async (req, res) => {
  try {
    const url = getImageUrl(req);
    if (!url) {
      return res.status(400).json({ success: false, message: 'No image file provided.' });
    }
    return res.status(200).json({ success: true, url });
  } catch (error) {
    console.error('uploadProductImage error:', error.message);
    return res.status(500).json({ success: false, message: 'Image upload failed.' });
  }
};

/**
 * POST /api/products/add  (also accepts POST /api/products)
 * Creates a new product. Admin-only in production.
 * Accepts multipart/form-data (with image file) OR application/json.
 */
const createProduct = async (req, res) => {
  try {
    const { name, description, price, stock_quantity, category_id, unit } = req.body;

    /* image_url: uploaded file takes priority, then JSON body field */
    const image_url = getImageUrl(req) || req.body.image_url || null;

    /* ── Validation ── */
    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, message: 'Product name is required.' });
    }
    const priceNum = Number(price);
    if (price === undefined || price === null || price === '' || isNaN(priceNum) || priceNum <= 0) {
      return res.status(400).json({ success: false, message: 'Price must be a number greater than 0.' });
    }
    const stockNum = Number(stock_quantity);
    if (stock_quantity === undefined || stock_quantity === null || stock_quantity === '' || isNaN(stockNum) || stockNum < 0) {
      return res.status(400).json({ success: false, message: 'stock_quantity must be 0 or more.' });
    }

    /* Detect optional unit column */
    const [colRows] = await pool.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'unit'`
    );
    const hasUnit = colRows.length > 0;

    let sql, sqlParams;
    if (hasUnit) {
      sql = `INSERT INTO products (category_id, name, description, price, stock_quantity, image_url, unit)
             VALUES (?, ?, ?, ?, ?, ?, ?)`;
      sqlParams = [category_id || null, String(name).trim(), description || null,
                   priceNum, stockNum, image_url, unit || 'kg'];
    } else {
      sql = `INSERT INTO products (category_id, name, description, price, stock_quantity, image_url)
             VALUES (?, ?, ?, ?, ?, ?)`;
      sqlParams = [category_id || null, String(name).trim(), description || null,
                   priceNum, stockNum, image_url];
    }

    const [result] = await pool.query(sql, sqlParams);

    return res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      data: { id: result.insertId, name: String(name).trim(), price: priceNum, stock_quantity: stockNum, image_url },
    });
  } catch (error) {
    console.error('createProduct error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

/**
 * PUT /api/products/:id
 * Updates an existing product. Admin-only.
 * Accepts multipart/form-data (with optional new image file) OR application/json.
 */
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, stock_quantity, category_id, unit } = req.body;

    /* Uploaded file takes priority; fall back to JSON body; fall back to null (keep existing) */
    const uploadedUrl = getImageUrl(req);
    /* If no new file was uploaded, check if client sent image_url as text in the form */
    const image_url = uploadedUrl || req.body.image_url || null;

    /* ── Validation ── */
    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, message: 'Product name is required.' });
    }
    const priceNum = Number(price);
    if (price === undefined || price === null || price === '' || isNaN(priceNum) || priceNum <= 0) {
      return res.status(400).json({ success: false, message: 'Price must be a number greater than 0.' });
    }
    const stockNum = Number(stock_quantity);
    if (stock_quantity === undefined || stock_quantity === null || stock_quantity === '' || isNaN(stockNum) || stockNum < 0) {
      return res.status(400).json({ success: false, message: 'stock_quantity must be 0 or more.' });
    }

    /* Detect optional unit column */
    const [colRows] = await pool.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'unit'`
    );
    const hasUnit = colRows.length > 0;

    let sql, sqlParams;
    if (hasUnit) {
      /* If no new image was provided, preserve the existing one */
      sql = image_url
        ? `UPDATE products SET category_id=?, name=?, description=?, price=?, stock_quantity=?, image_url=?, unit=? WHERE id=?`
        : `UPDATE products SET category_id=?, name=?, description=?, price=?, stock_quantity=?, unit=? WHERE id=?`;
      sqlParams = image_url
        ? [category_id || null, String(name).trim(), description || null, priceNum, stockNum, image_url, unit || 'kg', id]
        : [category_id || null, String(name).trim(), description || null, priceNum, stockNum, unit || 'kg', id];
    } else {
      sql = image_url
        ? `UPDATE products SET category_id=?, name=?, description=?, price=?, stock_quantity=?, image_url=? WHERE id=?`
        : `UPDATE products SET category_id=?, name=?, description=?, price=?, stock_quantity=? WHERE id=?`;
      sqlParams = image_url
        ? [category_id || null, String(name).trim(), description || null, priceNum, stockNum, image_url, id]
        : [category_id || null, String(name).trim(), description || null, priceNum, stockNum, id];
    }

    const [result] = await pool.query(sql, sqlParams);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    /* If stock was just increased from 0, send back-in-stock emails */
    if (stockNum > 0) {
      triggerStockNotifications(id).catch(() => {});
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
 * If the product has existing order_items (FK constraint), returns 409
 * with a clear message guiding the admin to deactivate instead.
 */
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    /* Check if any order_items reference this product before attempting delete */
    const [refRows] = await pool.query(
      'SELECT COUNT(*) AS cnt FROM order_items WHERE product_id = ?', [id]
    );
    const orderCount = Number(refRows[0]?.cnt ?? 0);

    if (orderCount > 0) {
      return res.status(409).json({
        success: false,
        message: `This product has ${orderCount} order record${orderCount !== 1 ? 's' : ''} and cannot be deleted. Set stock to 0 or deactivate it instead.`,
        has_orders: true,
        order_count: orderCount,
      });
    }

    const [result] = await pool.query('DELETE FROM products WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    return res.status(200).json({ success: true, message: 'Product deleted successfully.' });
  } catch (error) {
    /* Catch any remaining FK violations as a safety net */
    if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.errno === 1451) {
      return res.status(409).json({
        success: false,
        message: 'This product has linked orders and cannot be deleted. Set stock to 0 or deactivate it instead.',
        has_orders: true,
      });
    }
    console.error('deleteProduct error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

/**
 * PATCH /api/products/:id/deactivate
 * Admin-only — sets stock_quantity = 0 and is_active = 0.
 * Safe alternative to deleting when a product has existing orders.
 */
const deactivateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    /* Detect if is_active column exists */
    const [colRows] = await pool.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'is_active'`
    );
    const hasIsActive = colRows.length > 0;

    const sql = hasIsActive
      ? 'UPDATE products SET stock_quantity = 0, is_active = 0 WHERE id = ?'
      : 'UPDATE products SET stock_quantity = 0 WHERE id = ?';

    const [result] = await pool.query(sql, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Product deactivated — stock set to 0 and hidden from shop.',
    });
  } catch (error) {
    console.error('deactivateProduct error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

/**
 * PATCH /api/products/:id/reactivate
 * Admin-only — sets is_active = 1 so the product appears in the shop again.
 */
const reactivateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { stock_quantity } = req.body;   // optional — admin can set new stock

    const [colRows] = await pool.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'is_active'`
    );
    const hasIsActive = colRows.length > 0;

    let sql, params;
    if (hasIsActive && stock_quantity !== undefined) {
      sql = 'UPDATE products SET is_active = 1, stock_quantity = ? WHERE id = ?';
      params = [Math.max(0, Number(stock_quantity) || 0), id];
    } else if (hasIsActive) {
      sql = 'UPDATE products SET is_active = 1 WHERE id = ?';
      params = [id];
    } else {
      /* No is_active column — just update stock if provided */
      if (stock_quantity !== undefined) {
        sql = 'UPDATE products SET stock_quantity = ? WHERE id = ?';
        params = [Math.max(0, Number(stock_quantity) || 0), id];
      } else {
        return res.status(200).json({ success: true, message: 'No change needed.' });
      }
    }

    const [result] = await pool.query(sql, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    /* Fire back-in-stock email notifications asynchronously (don't block response) */
    const newStock = stock_quantity !== undefined ? Math.max(0, Number(stock_quantity) || 0) : null;
    if (newStock === null || newStock > 0) {
      triggerStockNotifications(id).catch(() => {});
    }

    return res.status(200).json({ success: true, message: 'Product reactivated.' });
  } catch (error) {
    console.error('reactivateProduct error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = {
  getProducts, getProductById, createProduct, updateProduct,
  deleteProduct, deactivateProduct, reactivateProduct, uploadProductImage,
};
