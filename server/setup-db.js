const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupDatabase() {
  console.log('🔧 Setting up database...');
  
  try {
    // First, try to connect without specifying a database
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });

    console.log('✅ Connected to MySQL server');

    // Create database if it doesn't exist
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'shopee_clone'}\``);
    console.log(`✅ Database '${process.env.DB_NAME || 'shopee_clone'}' created/verified`);

    // Switch to the database
    await connection.execute(`USE \`${process.env.DB_NAME || 'shopee_clone'}\``);

    // Create basic tables
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        avatar VARCHAR(500),
        date_of_birth DATE,
        address TEXT,
        phone VARCHAR(20),
        roles ENUM('User', 'Admin') DEFAULT 'User',
        verify TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;

    const createCategoriesTable = `
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;

    const createProductsTable = `
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(500) NOT NULL,
        description TEXT,
        category_id INT,
        image VARCHAR(500),
        images JSON,
        price DECIMAL(10,2) NOT NULL,
        price_before_discount DECIMAL(10,2),
        quantity INT DEFAULT 0,
        sold INT DEFAULT 0,
        view INT DEFAULT 0,
        rating DECIMAL(2,1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
      )
    `;

    await connection.execute(createUsersTable);
    console.log('✅ Users table created/verified');

    await connection.execute(createCategoriesTable);
    console.log('✅ Categories table created/verified');

    await connection.execute(createProductsTable);
    console.log('✅ Products table created/verified');

    // Insert sample categories
    const sampleCategories = [
      'Thời trang nam',
      'Điện thoại và phụ kiện',
      'Thiết bị điện tử',
      'Máy tính & laptop',
      'Máy ảnh & máy quay phim',
      'Đồng hồ',
      'Giày dép nam',
      'Thiết bị điện gia dụng',
      'Thể thao & du lịch',
      'Ô tô & xe máy & xe đạp',
      'Thời trang nữ',
      'Mẹ & bé',
      'Nhà cửa & đời sống',
      'Sắc đẹp',
      'Sức khoẻ',
      'Giày dép nữ',
      'Túi ví nữ',
      'Phụ kiện & trang sức nữ',
      'Bách hoá online',
      'Nhà sách online'
    ];

    for (const categoryName of sampleCategories) {
      await connection.execute(
        'INSERT IGNORE INTO categories (name) VALUES (?)',
        [categoryName]
      );
    }
    console.log('✅ Sample categories inserted');

    await connection.end();
    console.log('🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 Fix suggestions:');
      console.log('1. Check your MySQL root password');
      console.log('2. Try updating DB_PASSWORD in your .env file');
      console.log('3. Or set DB_PASSWORD to empty string if no password is set');
      console.log('4. You can also try: mysql -u root -p');
    }
    
    process.exit(1);
  }
}

setupDatabase();
