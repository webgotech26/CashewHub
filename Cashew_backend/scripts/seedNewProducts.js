'use strict';

/**
 * scripts/seedNewProducts.js
 *
 * Adds new categories (Oils, Brownies) and products
 * (Wood Pressed Gingelly Oil, Wood Pressed Groundnut Oil, Homemade Brownie)
 * to both local cashew_system and Railway DB.
 *
 * Safe to re-run — skips existing records by name.
 *
 * Usage: node scripts/seedNewProducts.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

const NEW_CATEGORIES = ['Oils', 'Brownies'];

const NEW_PRODUCTS = [
  {
    categoryName: 'Oils',
    name:        'Wood Pressed Gingelly Oil (1 Litre)',
    description: 'Cold-pressed sesame oil made using traditional wooden churning. No chemicals, no heat. Pure and natural.',
    price:        450.00,
    stock:        30,
    unit:         'litre',
    image_url:   '/assets/gingel.png',
  },
  {
    categoryName: 'Oils',
    name:        'Wood Pressed Groundnut Oil (1 Litre)',
    description: 'Traditional wood-pressed groundnut oil with natural aroma and taste. No refining, no additives.',
    price:        380.00,
    stock:        30,
    unit:         'litre',
    image_url:   '/assets/groundant.png',
  },
  {
    categoryName: 'Brownies',
    name:        'Homemade Brownie (Pack of 4)',
    description: 'Rich, fudgy homemade brownies made with premium ingredients. Freshly baked and packed with love.',
    price:        280.00,
    stock:        20,
    unit:         'pack',
    image_url:   '/assets/brownie.png',
  },
];

(async () => {
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST,
    port:     parseInt(process.env.DB_PORT, 10) || 3306,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  console.log('Connected to:', process.env.DB_NAME, '\n');

  // ── Step 1: Ensure categories exist ─────────────────────────
  const categoryIdMap = {};

  for (const catName of NEW_CATEGORIES) {
    const [[existing]] = await conn.query(
      'SELECT id FROM categories WHERE name = ? LIMIT 1', [catName]
    );
    if (existing) {
      categoryIdMap[catName] = existing.id;
      console.log(`  – Category "${catName}" already exists (id=${existing.id})`);
    } else {
      const [r] = await conn.query('INSERT INTO categories (name) VALUES (?)', [catName]);
      categoryIdMap[catName] = r.insertId;
      console.log(`  ✓ Created category "${catName}" (id=${r.insertId})`);
    }
  }

  // ── Step 2: Seed products ────────────────────────────────────
  console.log('\nSeeding products...\n');

  // Also check if 'unit' column exists (may not exist on older schemas)
  const [unitColRows] = await conn.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'unit'`
  );
  const hasUnit = unitColRows.length > 0;

  let added = 0, skipped = 0;

  for (const p of NEW_PRODUCTS) {
    const [[existing]] = await conn.query(
      'SELECT id FROM products WHERE name = ? LIMIT 1', [p.name]
    );

    if (existing) {
      // Update image_url in case it was stale
      await conn.query(
        'UPDATE products SET image_url = ?, category_id = ? WHERE id = ?',
        [p.image_url, categoryIdMap[p.categoryName], existing.id]
      );
      console.log(`  – "${p.name}" already exists — updated category + image`);
      skipped++;
    } else {
      if (hasUnit) {
        await conn.query(
          `INSERT INTO products (category_id, name, description, price, stock_quantity, is_active, image_url, unit)
           VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
          [categoryIdMap[p.categoryName], p.name, p.description, p.price, p.stock, p.image_url, p.unit]
        );
      } else {
        await conn.query(
          `INSERT INTO products (category_id, name, description, price, stock_quantity, is_active, image_url)
           VALUES (?, ?, ?, ?, ?, 1, ?)`,
          [categoryIdMap[p.categoryName], p.name, p.description, p.price, p.stock, p.image_url]
        );
      }
      console.log(`  ✓ Added "${p.name}" at ₹${p.price}`);
      added++;
    }
  }

  console.log(`\n✅ Done. ${added} added, ${skipped} skipped.\n`);
  await conn.end();
  process.exit(0);
})().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
