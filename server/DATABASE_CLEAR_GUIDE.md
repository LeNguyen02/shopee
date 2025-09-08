# Database Clear Guide

This guide explains how to clear your Shopee clone database data while preserving the table structure.

## Files Created

### 1. `clear-db.sql`
- **Purpose**: SQL script to clear all data from database tables
- **Usage**: Can be run directly in MySQL client or through Node.js
- **Features**:
  - Disables foreign key checks temporarily
  - Clears all tables in proper order
  - Resets AUTO_INCREMENT counters
  - Re-enables foreign key checks

### 2. `clear-database.js`
- **Purpose**: Node.js script to execute the database clearing
- **Usage**: `npm run clear-db`
- **Features**:
  - Programmatic execution of clear operations
  - Detailed logging of operations
  - Verification of cleanup results
  - Error handling

### 3. `clear-db-complete.sql`
- **Purpose**: Complete database reset (drops all tables)
- **Usage**: For complete database reset (use with caution)
- **Warning**: This will delete ALL data AND table structure

## How to Use

### Method 1: Using npm script (Recommended)
```bash
cd server
npm run clear-db
```

### Method 2: Using SQL file directly
```bash
# In MySQL client
mysql -u root -p shopee_clone < clear-db.sql
```

### Method 3: Complete reset (if needed)
```bash
# In MySQL client
mysql -u root -p shopee_clone < clear-db-complete.sql
```

## What Gets Cleared

The following tables are cleared in this order:
1. `order_items` (references orders and products)
2. `orders` (references users)
3. `cart_items` (references carts and products)
4. `carts` (references users)
5. `purchases` (references users and products)
6. `products` (references categories)
7. `users`
8. `categories`

## After Clearing

After clearing the database, you can reseed it with:
```bash
npm run migrate
```

This will:
- Recreate all tables (if using complete reset)
- Insert sample categories
- Insert sample products
- Set up all necessary data

## Safety Features

- Foreign key constraints are temporarily disabled during clearing
- AUTO_INCREMENT counters are reset to 1
- Detailed logging shows exactly what was cleared
- Verification step confirms all tables are empty
- Error handling prevents partial failures

## Troubleshooting

If you encounter issues:
1. Make sure your database connection is working
2. Check that you have proper permissions
3. Ensure no other processes are using the database
4. Try the complete reset method if foreign key issues persist

## Example Output

```
🧹 Starting database cleanup...
✅ Cleared order_items: 0 rows deleted
✅ Cleared orders: 7 rows deleted
✅ Cleared cart_items: 0 rows deleted
✅ Cleared carts: 2 rows deleted
✅ Cleared purchases: 0 rows deleted
✅ Cleared products: 5 rows deleted
✅ Cleared users: 2 rows deleted
✅ Cleared categories: 5 rows deleted
✅ Reset auto-increment for order_items
✅ Reset auto-increment for orders
✅ Reset auto-increment for cart_items
✅ Reset auto-increment for carts
✅ Reset auto-increment for purchases
✅ Reset auto-increment for products
✅ Reset auto-increment for users
✅ Reset auto-increment for categories

🔍 Verifying database cleanup...
   order_items: 0 rows
   orders: 0 rows
   cart_items: 0 rows
   carts: 0 rows
   purchases: 0 rows
   products: 0 rows
   users: 0 rows
   categories: 0 rows

🎉 Database cleanup completed successfully!
💡 You can now run "npm run migrate" to reseed the database
```
