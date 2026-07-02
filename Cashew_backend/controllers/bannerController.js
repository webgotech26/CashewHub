const pool = require('../config/db');

const getBanners = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM banners ORDER BY created_at DESC');
    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error('getBanners error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const createBanner = async (req, res) => {
  try {
    const { title, image_url, link_url, position, active } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'title is required.' });
    const [result] = await pool.query(
      'INSERT INTO banners (title, image_url, link_url, position, active) VALUES (?, ?, ?, ?, ?)',
      [title, image_url || null, link_url || null, position || 'home_top', active ? 1 : 1]
    );
    return res.status(201).json({ success: true, message: 'Banner created.', data: { id: result.insertId } });
  } catch (err) {
    console.error('createBanner error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, image_url, link_url, position, active } = req.body;
    const [result] = await pool.query(
      'UPDATE banners SET title=?, image_url=?, link_url=?, position=?, active=? WHERE id=?',
      [title, image_url || null, link_url || null, position || 'home_top', active ? 1 : 0, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Banner not found.' });
    return res.status(200).json({ success: true, message: 'Banner updated.' });
  } catch (err) {
    console.error('updateBanner error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM banners WHERE id=?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Banner not found.' });
    return res.status(200).json({ success: true, message: 'Banner deleted.' });
  } catch (err) {
    console.error('deleteBanner error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = { getBanners, createBanner, updateBanner, deleteBanner };
