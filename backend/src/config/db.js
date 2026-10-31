const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mysql = require('mysql2/promise');

const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
  database: process.env.DB_NAME || 'travel_planner',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

if (process.env.DB_SSL === 'true') {
  poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = mysql.createPool(poolConfig);

// Test database connection and log status
pool.getConnection()
  .then((connection) => {
    console.log(`[DB] Successfully connected to MySQL database: ${process.env.DB_NAME || 'travel_planner'} at ${process.env.DB_HOST || 'localhost'}`);
    connection.release();
  })
  .catch((err) => {
    console.error(`[DB] Database connection failure: ${err.message || err.code || err}`);
  });

module.exports = pool;
