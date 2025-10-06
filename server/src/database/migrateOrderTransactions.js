const { pool } = require('../config/database');

async function migrateOrderTransactions() {
  try {
    console.log('🔄 Creating order_transactions table...');
    
    // Create order_transactions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS order_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        admin_id INT,
        transaction_type ENUM('order_status_change', 'payment_status_change') NOT NULL,
        old_status VARCHAR(50),
        new_status VARCHAR(50) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_order_id (order_id),
        INDEX idx_transaction_type (transaction_type),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ Order_transactions table created successfully');
    console.log('🎉 Order transactions migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Order transactions migration failed:', error);
    throw error;
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateOrderTransactions()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = migrateOrderTransactions;
