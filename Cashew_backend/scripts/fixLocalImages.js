'use strict';

/**
 * Fixes image_url values in local cashew_system DB to match actual assets.
 * Run: node scripts/fixLocalImages.js
 */

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
    host: 'localhost', port: 3306,
    user: 'root', password: 'root', database: 'cashew_system',
  });

  console.log('Connected to cashew_system. Fixing image_url values...\n');

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
