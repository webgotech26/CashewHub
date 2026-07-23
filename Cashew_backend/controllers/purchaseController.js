const pool = require('../config/db');

const getPurchases = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT pu.*, s.name AS supplier_name, p.name AS product_name
      FROM purchases pu
      LEFT JOIN suppliers s ON pu.supplier_id = s.id
      LEFT JOIN products  p ON pu.product_id  = p.id
      ORDER BY pu.created_at DESC
    `);
    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error('getPurchases error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const createPurchase = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    /*
     * Accept both 'qty' and 'quantity' from the request body so the
     * frontend can send either field name without breaking validation.
     * Schema column: purchases.quantity  (DECIMAL 10,2)
     */
    const {
      supplier_id,
      product_id,
      qty,
      quantity,
      unit_cost,
      batch_number,
      expiry_date,
      notes,
      status,
    } = req.body;

    const purchaseQty = qty || quantity;  // accept either field name

    /* ── Validation ───────────────────────────────────────────── */
    if (!product_id || !purchaseQty || !unit_cost) {
      connection.release();
      return res.status(400).json({
        success: false,
        message: 'product_id, qty (or quantity), and unit_cost are required.',
      });
    }

    const qtyNum      = parseFloat(purchaseQty);
    const unitCostNum = parseFloat(unit_cost);

    if (isNaN(qtyNum) || qtyNum <= 0) {
      connection.release();
      return res.status(400).json({ success: false, message: 'qty must be a positive number.' });
    }
    if (isNaN(unitCostNum) || unitCostNum <= 0) {
      connection.release();
      return res.status(400).json({ success: false, message: 'unit_cost must be a positive number.' });
    }

    const validStatuses = ['ordered', 'received', 'partial', 'returned'];
    const purchaseStatus = validStatuses.includes(status) ? status : 'received';
    const total_cost = parseFloat((qtyNum * unitCostNum).toFixed(2));

    /* ── BEGIN TRANSACTION ────────────────────────────────────── */
    await connection.beginTransaction();

    /* Step 1: Insert into purchases */
    const [result] = await connection.query(
      `INSERT INTO purchases
         (supplier_id, product_id, quantity, unit_cost, total_cost, batch_number, expiry_date, notes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        supplier_id   || null,
        product_id,
        qtyNum,
        unitCostNum,
        total_cost,
        batch_number  || null,
        expiry_date   || null,
        notes         || null,
        purchaseStatus,
      ]
    );

    /* Step 2: Auto-increment product stock when status is 'received' */
    if (purchaseStatus === 'received') {
      await connection.query(
        'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?',
        [qtyNum, product_id]
      );
    }

    /* ── COMMIT ───────────────────────────────────────────────── */
    await connection.commit();
    connection.release();

    return res.status(201).json({
      success: true,
      message: purchaseStatus === 'received'
        ? 'Purchase recorded successfully. Stock updated.'
        : 'Purchase recorded successfully.',
      data: {
        id:           result.insertId,
        product_id,
        quantity:     qtyNum,
        unit_cost:    unitCostNum,
        total_cost,
        status:       purchaseStatus,
      },
    });

  } catch (err) {
    await connection.rollback();
    connection.release();
    console.error('createPurchase error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = { getPurchases, createPurchase };
