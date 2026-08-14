const mysql = require('mysql2/promise');

const pool = mysql.createPool(
  process.env.DB_URL || {
    host:               process.env.DB_HOST,
    port:               parseInt(process.env.DB_PORT, 10) || 3306,
    user:               process.env.DB_USER,
    password:           process.env.DB_PASSWORD,
    database:           process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit:    10,
    queueLimit:         0,
    enableKeepAlive:    true,
    keepAliveInitialDelay: 0,
    connectTimeout:     30000,   // 30 s — gives Railway proxy time to wake
  }
);

// Verify connection on startup — log clearly but do NOT crash the process.
// Render may route traffic before the DB proxy is fully ready; queries will
// retry automatically via the pool once the connection is established.
pool
  .getConnection()
  .then((conn) => {
    const dbName = process.env.DB_NAME || process.env.DB_URL?.split('/').pop() || 'unknown';
    console.log(`✅ MySQL connected → database: ${dbName}`);
    conn.release();
  })
  .catch((err) => {
    console.error('⚠️  MySQL initial connection check failed:', err.message);
    console.error('    The server will continue — queries will fail until the DB is reachable.');
    // Do NOT call process.exit(1) — let the HTTP server start so health
    // checks pass and Render does not mark the deploy as failed.
  });

module.exports = pool;