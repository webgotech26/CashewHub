/**
 * scripts/fixProductImages.js
 *
 * Safe migration:
 *   1. Adds image_url column to products if it doesn't exist (Railway DB)
 *   2. Updates all rows with the correct local asset path based on product name
 *
 * Asset mapping (mirrors getProductVisual in the frontend):
 *   Premium  → /assets/pre.jpeg
 *   Standard → /assets/stan.jpeg
 *   Economy  → /assets/norm.jpeg
 *   Roasted  → /assets/roast.jpeg
 *
 * Run once:
 *   node scripts/fixProductImages.js
 */

'use strict';

require('dotenv').config();
const pool = require('../config/db');

async function fixProductImages() {
  const conn = await pool.getConnection();
  try {
    // ── Step 1: Check if image_url column exists ───────────────────
    const [colRows] = await conn.query(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME   = 'products'
         AND COLUMN_NAME  = 'image_url'`
    );

    if (colRows.length === 0) {
      console.log('⚙️  image_url column missing — adding it now...');
      await conn.query(
        `ALTER TABLE products ADD COLUMN image_url VARCHAR(500) NULL AFTER stock_quantity`
      );
      console.log('✅ image_url column added.\n');
    } else {
      console.log('✅ image_url column already exists.\n');
    }

    // ── Step 2: Fetch all products ─────────────────────────────────
    const [products] = await conn.query(
      'SELECT id, name, image_url FROM products ORDER BY id'
    );

    console.log(`Found ${products.length} products. Updating image_url values...\n`);

    let updated = 0;

    for (const p of products) {
      const name = (p.name || '').toLowerCase();

      let correctImage;
      if (name.includes('premium')) {
        correctImage = '/assets/pre.jpeg';
      } else if (name.includes('standard')) {
        correctImage = '/assets/stan.jpeg';
      } else if (name.includes('economy')) {
        correctImage = '/assets/norm.jpeg';
      } else if (name.includes('roasted') || name.includes('roast')) {
        correctImage = '/assets/roast.jpeg';
      } else {
        correctImage = '/assets/norm.jpeg'; // safe default
      }

      if (p.image_url !== correctImage) {
        await conn.query(
          'UPDATE products SET image_url = ? WHERE id = ?',
          [correctImage, p.id]
        );
        console.log(`  ✓ ID ${String(p.id).padEnd(4)} "${p.name}"`);
        console.log(`         ${p.image_url || '(null)'} → ${correctImage}`);
        updated++;
      } else {
        console.log(`  – ID ${String(p.id).padEnd(4)} "${p.name}" — already correct`);
      }
    }

    console.log(`\n✅ Done. ${updated} product(s) updated.\n`);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    conn.release();
    process.exit(0);
  }
}

fixProductImages();
