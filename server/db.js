/**
 * Database connection module
 * Provides a connection to the database for the application
 */
const mysql = require('mysql2/promise');

// Create a connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'affiliateai',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test the connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Database connection established successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
}

// Execute a query
async function execute(sql, params) {
  try {
    const [rows, fields] = await pool.execute(sql, params);
    return [rows, fields];
  } catch (error) {
    console.error('Query execution error:', error);
    throw error;
  }
}

// Export the database functions
module.exports = {
  pool,
  testConnection,
  execute
};