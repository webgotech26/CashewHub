require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST,
    port:     parseInt(process.env.DB_PORT, 10) || 3306,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  // 1. Add image_url column only if it doesn't already exist
  const [cols] = await conn.query(`
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'products' AND COLUMN_NAME = 'image_url'
  `, [process.env.DB_NAME]);

  if (cols.length === 0) {
    await conn.query('ALTER TABLE products ADD COLUMN image_url VARCHAR(500) DEFAULT NULL');
    console.log('✅ image_url column added');
  } else {
    console.log('✅ image_url column already exists');
  }

  // 2. Products with "1kg" in the name → /assets/1kg.png
  const [r1] = await conn.query(
    "UPDATE products SET image_url = '/assets/1kg.png' WHERE name LIKE '%1kg%'"
  );

  // 3. Products with "1/2kg" in the name → /assets/1.5kg.png
  const [r2] = await conn.query(
    "UPDATE products SET image_url = '/assets/1.5kg.png' WHERE name LIKE '%1/2kg%'"
  );

  console.log('✅ 1kg image set on', r1.affectedRows, 'products');
  console.log('✅ 1.5kg image set on', r2.affectedRows, 'products');

  // 4. Verify
  const [rows] = await conn.query(
    'SELECT id, name, image_url FROM products ORDER BY id'
  );
  console.log('\nProduct image mapping:');
  rows.forEach(r =>
    console.log(` #${r.id} | ${r.name.padEnd(32)} | ${r.image_url || '(none)'}`)
  );

  await conn.end();
  process.exit(0);
})().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
