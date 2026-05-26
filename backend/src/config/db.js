const mysql = require('mysql2/promise');
require('dotenv').config();

let pool = null;

const createPool = () => {
  try {
    // Build SSL config — required for Aiven and other cloud MySQL providers
    let ssl = undefined;
    if (process.env.DB_SSL === 'true') {
      ssl = { rejectUnauthorized: false }; // works for Aiven without CA file
    }

    pool = mysql.createPool({
      host:               process.env.DB_HOST     || 'localhost',
      port:               parseInt(process.env.DB_PORT) || 3306,
      user:               process.env.DB_USER     || 'root',
      password:           process.env.DB_PASSWORD || 'root',
      database:           process.env.DB_NAME     || 'icf_hmis',
      waitForConnections: true,
      connectionLimit:    20,
      queueLimit:         0,
      timezone:           '+05:30',
      charset:            'utf8mb4',
      connectTimeout:     10000,
      ...(ssl && { ssl }),
    });

    pool.getConnection()
      .then(conn => {
        console.log('✅ MySQL connected successfully');
        conn.release();
      })
      .catch(err => {
        console.warn('⚠️  MySQL connection failed:', err.message);
        console.warn('   Running in DEMO MODE with mock data');
        pool = null;
      });
  } catch (e) {
    console.warn('⚠️  MySQL pool creation failed. Running in DEMO MODE.');
    pool = null;
  }
};

createPool();

// Proxy that returns mock data when DB is unavailable
const mockPool = {
  execute: async (sql, params) => {
    return [[], []];
  }
};

const getPool = () => pool || mockPool;

module.exports = new Proxy({}, {
  get(target, prop) {
    return (...args) => getPool()[prop](...args);
  }
});
