const { pool } = require('./src/config/database');
const fs = require('fs');
const path = require('path');

const clearDatabase = async () => {
  try {
    console.log('🧹 Starting database cleanup...');
    
    // Disable foreign key checks
    await pool.execute('SET FOREIGN_KEY_CHECKS = 0');
    
    // List of tables to clear in order (respecting foreign key dependencies)
    const tables = [
      'order_items',
      'orders', 
      'cart_items',
      'carts',
      'purchases',
      'products',
      'users',
      'categories'
    ];
    
    // Clear each table
    for (const table of tables) {
      try {
        const [result] = await pool.execute(`DELETE FROM ${table}`);
        console.log(`✅ Cleared ${table}: ${result.affectedRows} rows deleted`);
      } catch (error) {
        console.log(`⚠️  Could not clear ${table}: ${error.message}`);
      }
    }
    
    // Reset auto-increment counters
    for (const table of tables) {
      try {
        await pool.execute(`ALTER TABLE ${table} AUTO_INCREMENT = 1`);
        console.log(`✅ Reset auto-increment for ${table}`);
      } catch (error) {
        console.log(`⚠️  Could not reset auto-increment for ${table}: ${error.message}`);
      }
    }
    
    // Re-enable foreign key checks
    await pool.execute('SET FOREIGN_KEY_CHECKS = 1');
    
    // Verify tables are empty
    console.log('\n🔍 Verifying database cleanup...');
    
    for (const table of tables) {
      try {
        const [result] = await pool.execute(`SELECT COUNT(*) as count FROM ${table}`);
        const count = result[0].count;
        console.log(`   ${table}: ${count} rows`);
      } catch (error) {
        console.log(`   ${table}: table doesn't exist or error checking`);
      }
    }
    
    console.log('\n🎉 Database cleanup completed successfully!');
    console.log('💡 You can now run "npm run migrate" to reseed the database');
    
  } catch (error) {
    console.error('❌ Database cleanup failed:', error.message);
    process.exit(1);
  } finally {
    // Close the connection pool
    await pool.end();
  }
};

// Run if this file is executed directly
if (require.main === module) {
  clearDatabase();
}

module.exports = clearDatabase;
