const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'shopee_clone',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create connection pool
const pool = mysql.createPool(dbConfig);
if (typeof pool.on === 'function') {
  pool.on('connection', (connection) => {
    // Set session time zone for this connection
    connection.query("SET time_zone = '+07:00'");
  });
}
// Test database connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('💡 Please check your MySQL credentials in .env file');
    console.log('💡 Try setting DB_PASSWORD to your MySQL root password');
    // Don't exit, let server start anyway for testing
  }
};

module.exports = { pool, testConnection };
