/**
 * scripts/seedProducts.js
 * Seeds categories + products into the Railway DB.
 * Safe to re-run — skips existing records by name.
 *
 * Usage: node scripts/seedProducts.js
 */

'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');

const PRODUCTS = [
  { name: 'Premium 210 (1kg Normal)',    description: 'Premium Quality 1kg',    price: 690.00,  stock: 50, image: '/assets/pre.jpeg'   },
  { name: 'Premium 210 (1/2kg Normal)',  description: 'Premium Quality 0.5kg',  price: 350.00,  stock: 50, image: '/assets/pre.jpeg'   },
  { name: 'Standard 240 (1kg Normal)',   description: 'Standard Quality 1kg',   price: 970.00,  stock: 49, image: '/assets/stan.jpeg'  },
  { name: 'Standard 240 (1/2kg Normal)', description: 'Standard Quality 0.5kg', price: 485.00,  stock: 44, image: '/assets/stan.jpeg'  },
  { name: 'Economy 320 (1kg Normal)',    description: 'Economy Quality 1kg',    price: 890.00,  stock: 48, image: '/assets/norm.jpeg'  },
  { name: 'Economy 320 (1/2kg Normal)',  description: 'Economy Quality 0.5kg',  price: 445.00,  stock: 47, image: '/assets/norm.jpeg'  },
  { name: 'Roasted Cashew (1kg)',        description: 'Roasted Special 1kg',    price: 1200.00, stock: 50, image: '/assets/roast.jpeg' },
  { name: 'Roasted Cashew (1/2kg)',      description: 'Roasted Special 0.5kg',  price: 600.00,  stock: 46, image: '/assets/roast.jpeg' },
];

(async () => {
  let conn;
  try {
    conn = await mysql.createConnection({
      host:     process.env.DB_HOST,
      port:     parseInt(process.env.DB_PORT, 10) || 3306,
      user:     process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
    console.log('✅ Connected to:', process.env.DB_NAME, '\n');

    // ── Ensure categories table has at least one row ───────────────
    await conn.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    let [[cat]] = await conn.query(
      "SELECT id FROM categories WHERE name = 'Cashew' LIMIT 1"
    );
    let categoryId;
    if (cat) {
      categoryId = cat.id;
      console.log(`– Category 'Cashew' already exists (id=${categoryId})`);
    } else {
      const [r] = await conn.query(
        "INSERT INTO categories (name) VALUES ('Cashew')"
      );
      categoryId = r.insertId;
      console.log(`✓ Created category 'Cashew' (id=${categoryId})`);
    }

    // ── Seed products ──────────────────────────────────────────────
    console.log('\nSeeding products...\n');
    let added = 0, skipped = 0;

    for (const p of PRODUCTS) {
      const [[existing]] = await conn.query(
        'SELECT id FROM products WHERE name = ? LIMIT 1', [p.name]
      );

      if (existing) {
        // Update image_url in case it was wrong
        await conn.query(
          'UPDATE products SET image_url = ? WHERE id = ?',
          [p.image, existing.id]
        );
        console.log(`  – "${p.name}" already exists — image updated`);
        skipped++;
      } else {
        await conn.query(
          `INSERT INTO products (category_id, name, description, price, stock_quantity, is_active, image_url)
           VALUES (?, ?, ?, ?, ?, 1, ?)`,
          [categoryId, p.name, p.description, p.price, p.stock, p.image]
        );
        console.log(`  ✓ "${p.name}" added`);
        added++;
      }
    }

    console.log(`\n✅ Done. ${added} added, ${skipped} skipped.\n`);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
    process.exit(0);
  }
})();
