/**
 * Run this script ONCE to insert the admin record with a bcrypt-hashed password.
 * Usage: node scripts/seedAdmin.js
 *
 * Change ADMIN_USERNAME and ADMIN_PASSWORD below before running.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

const ADMIN_USERNAME = 'admin';      // ← change if needed
const ADMIN_NAME     = 'Admin';      // ← display name
const ADMIN_PASSWORD = 'admin123';   // ← change to your desired password

const SALT_ROUNDS = 12;

(async () => {
  let connection;
  try {
    connection = await mysql.createConnection({
      host:     process.env.DB_HOST,
      port:     parseInt(process.env.DB_PORT, 10) || 3306,
      user:     process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    console.log('✅ Connected to database:', process.env.DB_NAME);

    // Ensure admins table exists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        username VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Check if admin already exists
    const [existing] = await connection.query(
      'SELECT id FROM admins WHERE username = ?',
      [ADMIN_USERNAME]
    );

    if (existing.length > 0) {
      console.log(`⚠️  Admin '${ADMIN_USERNAME}' already exists. Updating password...`);
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);
      await connection.query(
        'UPDATE admins SET password = ? WHERE username = ?',
        [hashedPassword, ADMIN_USERNAME]
      );
      console.log(`✅ Password updated for admin '${ADMIN_USERNAME}'.`);
    } else {
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);
      await connection.query(
        'INSERT INTO admins (name, username, password) VALUES (?, ?, ?)',
        [ADMIN_NAME, ADMIN_USERNAME, hashedPassword]
      );
      console.log(`✅ Admin '${ADMIN_USERNAME}' created successfully.`);
    }

    console.log('\n── Login Credentials ──────────────');
    console.log(`   Username : ${ADMIN_USERNAME}`);
    console.log(`   Password : ${ADMIN_PASSWORD}`);
    console.log('────────────────────────────────────\n');
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
    process.exit(0);
  }
})();
