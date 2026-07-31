'use strict';

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

  console.log('Connected to:', process.env.DB_NAME);

  // Both oils use groundant.png until gingel.png is added
  const fixes = [
    { match: '%Gingelly%',  img: '/assets/groundant.png' },
    { match: '%Groundnut%', img: '/assets/groundant.png' },
    { match: '%Brownie%',   img: '/assets/brownie.png'   },
  ];

  for (const f of fixes) {
    const [r] = await conn.query(
      'UPDATE products SET image_url = ? WHERE name LIKE ?',
      [f.img, f.match]
    );
    console.log(f.match + ' -> ' + f.img + ' (' + r.affectedRows + ' row)');
  }

  // Verify
  const [rows] = await conn.query(
    'SELECT id, name, image_url FROM products WHERE id >= 10 ORDER BY id'
  );
  console.log('\nVerification:');
  rows.forEach(r => console.log('  [' + r.id + '] ' + r.name + ' => ' + r.image_url));

  await conn.end();
  process.exit(0);
})().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
