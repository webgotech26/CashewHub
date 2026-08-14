/**
 * scripts/migrateSchema.js
 *
 * Safe, idempotent migration — adds columns that may be missing from older
 * Railway / local deployments without dropping or recreating any tables.
 *
 * Run once after pulling this update:
 *   node scripts/migrateSchema.js
 *
 * It is safe to run multiple times; existing columns are never modified.
 */

'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');

/* ── Migration definitions ─────────────────────────────────────────────── */
const MIGRATIONS = [
  /* Products — image_url */
  {
    table:  'products',
    column: 'image_url',
    ddl:    'ALTER TABLE products ADD COLUMN image_url VARCHAR(500) DEFAULT NULL',
    after:  'stock_quantity',
  },
  /* Products — unit */
  {
    table:  'products',
    column: 'unit',
    ddl:    "ALTER TABLE products ADD COLUMN unit VARCHAR(20) NOT NULL DEFAULT 'kg'",
    after:  'image_url',
  },
  /* Categories — description */
  {
    table:  'categories',
    column: 'description',
    ddl:    'ALTER TABLE categories ADD COLUMN description TEXT DEFAULT NULL',
    after:  'name',
  },
];

async function columnExists(conn, table, column) {
  const [rows] = await conn.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return rows.length > 0;
}

(async () => {
  let conn;
  try {
    conn = await mysql.createConnection(
      process.env.DB_URL || {
        host:     process.env.DB_HOST,
        port:     parseInt(process.env.DB_PORT, 10) || 3306,
        user:     process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
      }
    );
    console.log('✅ Connected\n');
    console.log('Running migrations…\n');

    for (const m of MIGRATIONS) {
      const exists = await columnExists(conn, m.table, m.column);
      if (exists) {
        console.log(`  ✓ ${m.table}.${m.column} — already exists, skipped`);
      } else {
        await conn.query(m.ddl);
        console.log(`  + ${m.table}.${m.column} — ADDED`);
      }
    }

    console.log('\n✅ Migration complete.\n');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
    process.exit(0);
  }
})();
