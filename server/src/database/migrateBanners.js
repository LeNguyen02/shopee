const { pool } = require('../config/database')

async function migrateBanners() {
  console.log('🔄 Creating banners table...')
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS banners (
      id INT AUTO_INCREMENT PRIMARY KEY,
      image VARCHAR(255) NOT NULL,
      link VARCHAR(255) NULL,
      position ENUM('main','right') DEFAULT 'main',
      sort_order INT DEFAULT 0,
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)
  console.log('✅ Banners table created successfully')
}

module.exports = migrateBanners


