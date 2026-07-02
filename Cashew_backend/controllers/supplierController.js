const pool = require('../config/db');

const getSuppliers = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, contact_person, phone, email, gstin, address, created_at FROM suppliers ORDER BY name ASC'
    );
    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error('getSuppliers error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const createSupplier = async (req, res) => {
  try {
    const { name, contact_person, phone, email, gstin, address } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Supplier name is required.' });

    const [result] = await pool.query(
      'INSERT INTO suppliers (name, contact_person, phone, email, gstin, address) VALUES (?, ?, ?, ?, ?, ?)',
      [name, contact_person || null, phone || null, email || null, gstin || null, address || null]
    );
    return res.status(201).json({ success: true, message: 'Supplier created.', data: { id: result.insertId, name } });
  } catch (err) {
    console.error('createSupplier error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contact_person, phone, email, gstin, address } = req.body;
    const [result] = await pool.query(
      'UPDATE suppliers SET name=?, contact_person=?, phone=?, email=?, gstin=?, address=? WHERE id=?',
      [name, contact_person || null, phone || null, email || null, gstin || null, address || null, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Supplier not found.' });
    return res.status(200).json({ success: true, message: 'Supplier updated.' });
  } catch (err) {
    console.error('updateSupplier error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM suppliers WHERE id=?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Supplier not found.' });
    return res.status(200).json({ success: true, message: 'Supplier deleted.' });
  } catch (err) {
    console.error('deleteSupplier error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = { getSuppliers, createSupplier, updateSupplier, deleteSupplier };
