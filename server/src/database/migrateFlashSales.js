const { pool } = require('../config/database')

async function migrateFlashSales() {
  // flash_sales table
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS flash_sales (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      start_time DATETIME NOT NULL,
      end_time DATETIME NOT NULL,
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_flash_sales_time (start_time, end_time),
      INDEX idx_flash_sales_active (is_active)
    )
  `)

  // flash_sale_items table
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS flash_sale_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      flash_sale_id INT NOT NULL,
      product_id INT NOT NULL,
      sale_price DECIMAL(10,2) NOT NULL,
      item_limit INT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_flash_sale_product (flash_sale_id, product_id),
      CONSTRAINT fk_fsi_flash_sale FOREIGN KEY (flash_sale_id) REFERENCES flash_sales(id) ON DELETE CASCADE,
      CONSTRAINT fk_fsi_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )
  `)
}

module.exports = migrateFlashSales


