-- =====================================================
-- Complete Database Clear Script for Shopee Clone
-- =====================================================
-- This script completely clears all data and resets the database
-- WARNING: This will delete ALL data in your database!
-- =====================================================

-- Disable foreign key checks
SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- Drop all tables (this will remove all data and structure)
-- =====================================================

DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS carts;
DROP TABLE IF EXISTS purchases;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS categories;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- Success message
-- =====================================================
SELECT 'Database completely cleared! All tables have been dropped.' as message;
SELECT 'Run "npm run migrate" to recreate tables and seed data.' as next_step;
