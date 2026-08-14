/**
 * scripts/seedProducts.js
 * Seeds categories + products into the database.
 * Safe to re-run — skips existing records by name, updates images.
 *
 * Usage:
 *   node scripts/seedProducts.js                  ← uses .env in parent dir
 *   DB_URL=mysql://... node scripts/seedProducts.js ← override via env
 */

'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');

/* ── Product data — image paths match /public/assets/ in both frontends ── */
const CATEGORIES = [
  { name: 'Cashews'  },
  { name: 'Oils'     },
  { name: 'Brownies' },
];

const PRODUCTS = [
  /* ── Cashews ── */
  {
    category: 'Cashews',
    name: 'Premium Cashew (1 kg)',
    description: 'W210 grade — extra large premium cashews, hand-selected.',
    price: 690.00, stock: 50, image: '/assets/premium.png',
  },
  {
    category: 'Cashews',
    name: 'Premium Cashew (1/2 kg)',
    description: 'W210 grade — extra large premium cashews, hand-selected.',
    price: 350.00, stock: 50, image: '/assets/premium.png',
  },
  {
    category: 'Cashews',
    name: 'Standard Cashew (1 kg)',
    description: 'W240 grade — medium-large cashews, great for everyday snacking.',
    price: 620.00, stock: 49, image: '/assets/standard.png',
  },
  {
    category: 'Cashews',
    name: 'Standard Cashew (1/2 kg)',
    description: 'W240 grade — medium-large cashews, great for everyday snacking.',
    price: 315.00, stock: 44, image: '/assets/standard.png',
  },
  {
    category: 'Cashews',
    name: 'Economy Cashew (1 kg)',
    description: 'W320 grade — most popular grade, ideal for cooking and sweets.',
    price: 560.00, stock: 48, image: '/assets/economy.png',
  },
  {
    category: 'Cashews',
    name: 'Economy Cashew (1/2 kg)',
    description: 'W320 grade — most popular grade, ideal for cooking and sweets.',
    price: 285.00, stock: 47, image: '/assets/economy.png',
  },
  {
    category: 'Cashews',
    name: 'Roasted Cashew (1 kg)',
    description: 'Lightly roasted with sea salt — crunchy and addictive.',
    price: 750.00, stock: 50, image: '/assets/roasted.png',
  },
  {
    category: 'Cashews',
    name: 'Roasted Cashew (1/2 kg)',
    description: 'Lightly roasted with sea salt — crunchy and addictive.',
    price: 385.00, stock: 46, image: '/assets/roasted.png',
  },

  /* ── Oils ── */
  {
    category: 'Oils',
    name: 'Gingelly Oil (500 ml)',
    description: 'Cold-pressed sesame oil. Traditional wood-press extraction.',
    price: 280.00, stock: 30, image: '/assets/groundant.png',
  },
  {
    category: 'Oils',
    name: 'Groundnut Oil (500 ml)',
    description: 'Cold-pressed peanut oil. Pure and chemical-free.',
    price: 240.00, stock: 30, image: '/assets/groundant.png',
  },

  /* ── Brownies ── */
  {
    category: 'Brownies',
    name: 'Cashew Brownie (Box of 6)',
    description: 'Rich chocolate brownies loaded with premium cashews.',
    price: 320.00, stock: 20, image: '/assets/brownie.png',
  },
];

/* ── Helpers ──────────────────────────────────────────────────────────── */
async function getOrCreate(conn, table, field, value) {
  const [[existing]] = await conn.query(
    `SELECT id FROM ${table} WHERE ${field} = ? LIMIT 1`, [value]
  );
  if (existing) return existing.id;
  const [r] = await conn.query(
    `INSERT INTO ${table} (${field}) VALUES (?)`, [value]
  );
  return r.insertId;
}

/* ── Main ─────────────────────────────────────────────────────────────── */
(async () => {
  let conn;
  try {
    /* Support both DB_URL (Railway) and individual vars (local) */
    conn = await mysql.createConnection(
      process.env.DB_URL || {
        host:     process.env.DB_HOST,
        port:     parseInt(process.env.DB_PORT, 10) || 3306,
        user:     process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
      }
    );

    const dbName = process.env.DB_NAME
      || process.env.DB_URL?.split('/').pop()
      || 'unknown';
    console.log(`✅ Connected to: ${dbName}\n`);

    /* Ensure tables exist (idempotent) */
    await conn.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        name       VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS products (
        id             INT AUTO_INCREMENT PRIMARY KEY,
        category_id    INT,
        name           VARCHAR(150) NOT NULL UNIQUE,
        description    TEXT,
        price          DECIMAL(10,2) NOT NULL,
        stock_quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
        is_active      TINYINT(1) NOT NULL DEFAULT 1,
        image_url      VARCHAR(500),
        created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
      )`);

    /* Add image_url column if it doesn't exist (schema migration) */
    const [imgCol] = await conn.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'image_url'`
    );
    if (imgCol.length === 0) {
      await conn.query('ALTER TABLE products ADD COLUMN image_url VARCHAR(500)');
      console.log('✓ Added image_url column to products table');
    }

    /* Seed categories */
    console.log('Seeding categories…');
    const catIdMap = {};
    for (const cat of CATEGORIES) {
      catIdMap[cat.name] = await getOrCreate(conn, 'categories', 'name', cat.name);
      console.log(`  – "${cat.name}" (id=${catIdMap[cat.name]})`);
    }

    /* Seed products */
    console.log('\nSeeding products…');
    let added = 0, updated = 0;

    for (const p of PRODUCTS) {
      const categoryId = catIdMap[p.category];
      const [[existing]] = await conn.query(
        'SELECT id FROM products WHERE name = ? LIMIT 1', [p.name]
      );

      if (existing) {
        await conn.query(
          'UPDATE products SET image_url = ?, price = ?, stock_quantity = ?, is_active = 1 WHERE id = ?',
          [p.image, p.price, p.stock, existing.id]
        );
        console.log(`  ↺  "${p.name}" updated`);
        updated++;
      } else {
        await conn.query(
          `INSERT INTO products
             (category_id, name, description, price, stock_quantity, is_active, image_url)
           VALUES (?, ?, ?, ?, ?, 1, ?)`,
          [categoryId, p.name, p.description, p.price, p.stock, p.image]
        );
        console.log(`  ✓  "${p.name}" added`);
        added++;
      }
    }

    /* Verify */
    const [[{ total }]] = await conn.query(
      'SELECT COUNT(*) AS total FROM products WHERE is_active = 1'
    );
    console.log(`\n✅ Done. ${added} added, ${updated} updated.`);
    console.log(`📦 Total active products in DB: ${total}\n`);

  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
    process.exit(0);
  }
})();
