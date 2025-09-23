require('dotenv').config()
const { pool } = require('../config/database')
const migrateOrders = require('./migrateOrders')
const migrateOrderTransactions = require('./migrateOrderTransactions')
const { addInventoryConstraints } = require('./addInventoryConstraints')
const migrateFlashSales = require('./migrateFlashSales')
const migrateBanners = require('./migrateBanners')
const migrateMomo = require('./migrateMomo')

// Migration tracker
async function ensureMigrationsTable() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)
}

async function hasStepRun(name) {
  const [rows] = await pool.execute(
    'SELECT 1 FROM schema_migrations WHERE name = ? LIMIT 1',
    [name]
  )
  return rows.length > 0
}

async function markStepRun(name) {
  await pool.execute(
    'INSERT IGNORE INTO schema_migrations (name) VALUES (?)',
    [name]
  )
}

async function runStepOnce(name, fn) {
  const done = await hasStepRun(name)
  if (done) {
    console.log(`↪️  Skipping step "${name}" (already executed)`)
    return
  }
  console.log(`▶️  Running step "${name}"...`)
  await fn()
  await markStepRun(name)
  console.log(`✅ Step "${name}" completed`)
}

async function createBaseTables() {
  // users
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(20),
      address TEXT,
      date_of_birth DATE,
      avatar VARCHAR(255),
      roles ENUM('User', 'Admin') DEFAULT 'User',
      verify TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `)

  // categories
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `)

  // Ensure image column exists on categories
  try {
    await pool.execute('ALTER TABLE categories ADD COLUMN image VARCHAR(255) NULL')
  } catch (e) {
    // Ignore if column already exists
  }

  // products
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      category_id INT,
      image VARCHAR(255),
      images JSON,
      price DECIMAL(10, 2) NOT NULL,
      price_before_discount DECIMAL(10, 2),
      quantity INT DEFAULT 0,
      sold INT DEFAULT 0,
      view INT DEFAULT 0,
      rating DECIMAL(2, 1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    )
  `)

  // carts
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS carts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY unique_user_cart (user_id)
    )
  `)

  // cart_items
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS cart_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      cart_id INT NOT NULL,
      product_id INT NOT NULL,
      quantity INT NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      UNIQUE KEY unique_cart_product (cart_id, product_id)
    )
  `)

  // purchases (legacy order history)
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS purchases (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      buy_count INT NOT NULL,
      price DECIMAL(10, 2) NOT NULL,
      price_before_discount DECIMAL(10, 2),
      status ENUM('wait_for_confirmation', 'wait_for_getting', 'in_progress', 'delivered', 'cancelled') DEFAULT 'wait_for_confirmation',
      product_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )
  `)
}

async function seedBasics() {
  await pool.execute(`
    INSERT IGNORE INTO categories (id, name) VALUES 
    (1, 'Electronics'),
    (2, 'Fashion'),
    (3, 'Home & Garden'),
    (4, 'Sports'),
    (5, 'Books')
  `)
}

async function runMigrations() {
  try {
    console.log('🚀 Starting database migrations...')
    await ensureMigrationsTable()

    await runStepOnce('base_tables', async () => {
      await createBaseTables()
    })

    await runStepOnce('orders', async () => {
      await migrateOrders()
    })

    await runStepOnce('flash_sales', async () => {
      await migrateFlashSales()
    })

  await runStepOnce('banners', async () => {
    await migrateBanners()
  })
    
    await runStepOnce('order_transactions', async () => {
      await migrateOrderTransactions()
    })

    await runStepOnce('inventory_constraints', async () => {
      await addInventoryConstraints()
    })

    await runStepOnce('momo', async () => {
      await migrateMomo()
    })

    await runStepOnce('seed_basics', async () => {
      await seedBasics()
    })

    console.log('✅ Database migrations completed successfully')
    process.exit(0)
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations()
}

module.exports = {}