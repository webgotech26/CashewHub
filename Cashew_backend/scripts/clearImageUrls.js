'use strict';

/**
 * scripts/clearImageUrls.js
 *
 * Clears the image_url column on all products so productVisual.js
 * controls image rendering entirely (premium.png, standard.png, economy.png).
 *
 * Run: node scripts/clearImageUrls.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST,
    port:     parseInt(process.env.DB_PORT, 10) || 3306,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  console.log('Connected to:', process.env.DB_NAME, '\n');

  // Clear all stale image_url values
  const [result] = await conn.query('UPDATE products SET image_url = NULL');
  console.log('Cleared image_url on', result.affectedRows, 'products.\n');

  // Verify
  const [rows] = await conn.query('SELECT id, name, image_url FROM products ORDER BY id');
  rows.forEach(r => {
    const img = r.image_url || '(null — productVisual.js will handle)';
    console.log('[' + r.id + '] ' + r.name + ' → ' + img);
  });

  console.log('\nDone. All products will now use local asset images from productVisual.js.');
  await conn.end();
  process.exit(0);
})().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
