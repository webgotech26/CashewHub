'use strict';

/**
 * Fixes image_url values in Railway DB to match actual assets.
 * Run: node scripts/fixRailwayImages.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

const UPDATES = [
  { id: 41, img: '/assets/pre.jpeg'   },
  { id: 42, img: '/assets/pre.jpeg'   },
  { id: 43, img: '/assets/stan.jpeg'  },
  { id: 44, img: '/assets/stan.jpeg'  },
  { id: 45, img: '/assets/norm.jpeg'  },
  { id: 46, img: '/assets/norm.jpeg'  },
  { id: 47, img: '/assets/roast.jpeg' },
  { id: 48, img: '/assets/roast.jpeg' },
];

(async () => {
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST,
    port:     parseInt(process.env.DB_PORT, 10) || 3306,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  console.log('Connected to Railway DB (' + process.env.DB_NAME + '). Fixing image_url values...\n');

  for (const u of UPDATES) {
    const [r] = await conn.query(
      'UPDATE products SET image_url = ? WHERE id = ?', [u.img, u.id]
    );
    console.log('ID ' + u.id + ' -> ' + u.img + ' (' + r.affectedRows + ' row updated)');
  }

  // Verify
  const [rows] = await conn.query(
    'SELECT id, name, image_url FROM products ORDER BY id'
  );
  console.log('\nVerification:');
  rows.forEach(r => console.log('  [' + r.id + '] ' + r.name + ' -> ' + r.image_url));

  console.log('\nDone.');
  await conn.end();
  process.exit(0);
})().catch(err => {
  console.error('Failed:', err.message);
  process.exit(1);
});
