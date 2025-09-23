const { pool } = require('../config/database');

const addInventoryConstraints = async () => {
  try {
    console.log('🔄 Adding inventory constraints...');
    
    // Add constraint to prevent negative quantity
    await pool.query(`
      ALTER TABLE products 
      ADD CONSTRAINT chk_quantity_non_negative 
      CHECK (quantity >= 0)
    `);
    
    console.log('✅ Inventory constraints added successfully');
  } catch (error) {
    if (error.code === 'ER_DUP_KEYNAME') {
      console.log('ℹ️  Constraint already exists, skipping...');
    } else {
      console.error('❌ Error adding inventory constraints:', error.message);
      throw error;
    }
  }
};

module.exports = { addInventoryConstraints };

// Run if this file is executed directly
if (require.main === module) {
  addInventoryConstraints()
    .then(() => {
      console.log('🎉 Inventory constraints setup completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Setup failed:', error);
      process.exit(1);
    });
}
