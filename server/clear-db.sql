-- =====================================================
-- Clear Database Data Script for Shopee Clone
-- =====================================================
-- This script clears all data from tables while preserving table structure
-- Run this script to reset your database to empty state
-- =====================================================

-- Disable foreign key checks temporarily to avoid constraint issues
SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- Clear all tables - using DELETE for better compatibility
-- =====================================================

-- Clear order_items table (references orders and products)
DELETE FROM order_items;

-- Clear orders table (references users)
DELETE FROM orders;

-- Clear cart_items table (references carts and products)
DELETE FROM cart_items;

-- Clear carts table (references users)
DELETE FROM carts;

-- Clear purchases table (references users and products)
DELETE FROM purchases;

-- Clear products table (references categories)
DELETE FROM products;

-- Clear users table
DELETE FROM users;

-- Clear categories table
DELETE FROM categories;

-- =====================================================
-- Reset AUTO_INCREMENT counters
-- =====================================================

-- Reset auto-increment counters to start from 1 again
ALTER TABLE users AUTO_INCREMENT = 1;
ALTER TABLE categories AUTO_INCREMENT = 1;
ALTER TABLE products AUTO_INCREMENT = 1;
ALTER TABLE carts AUTO_INCREMENT = 1;
ALTER TABLE cart_items AUTO_INCREMENT = 1;
ALTER TABLE purchases AUTO_INCREMENT = 1;
ALTER TABLE orders AUTO_INCREMENT = 1;
ALTER TABLE order_items AUTO_INCREMENT = 1;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- Verification queries (optional - uncomment to check)
-- =====================================================

-- Uncomment these lines to verify all tables are empty:
-- SELECT 'users' as table_name, COUNT(*) as row_count FROM users
-- UNION ALL
-- SELECT 'categories', COUNT(*) FROM categories
-- UNION ALL
-- SELECT 'products', COUNT(*) FROM products
-- UNION ALL
-- SELECT 'carts', COUNT(*) FROM carts
-- UNION ALL
-- SELECT 'cart_items', COUNT(*) FROM cart_items
-- UNION ALL
-- SELECT 'purchases', COUNT(*) FROM purchases
-- UNION ALL
-- SELECT 'orders', COUNT(*) FROM orders
-- UNION ALL
-- SELECT 'order_items', COUNT(*) FROM order_items;

-- =====================================================
-- Success message
-- =====================================================
SELECT 'Database cleared successfully! All tables are now empty.' as message;
