# MySQL Password Reset Instructions

## Problem
The MySQL root user requires a password, but you don't remember it.

## Solution Options

### Option 1: Use System Preferences (Easiest)
1. Open **System Preferences** on your Mac
2. Look for **MySQL** in the bottom section
3. Click on **MySQL**
4. Click **Stop MySQL Server**
5. Click **Start MySQL Server**
6. Try connecting without password: `mysql -u root`

### Option 2: Reset via Terminal
1. Stop MySQL: `brew services stop mysql`
2. Start MySQL in safe mode: `sudo mysqld_safe --skip-grant-tables &`
3. Connect: `mysql -u root`
4. Run these commands:
   ```sql
   FLUSH PRIVILEGES;
   ALTER USER 'root'@'localhost' IDENTIFIED BY 'password';
   FLUSH PRIVILEGES;
   EXIT;
   ```
5. Kill safe mode: `sudo pkill mysqld_safe`
6. Start normally: `brew services start mysql`
7. Test: `mysql -u root -ppassword`

### Option 3: Use the Setup Script
Run the setup script we created:
```bash
cd /Applications/FREELANCE/Shopee/server
./setup-mysql.sh
```

### Option 4: Reinstall MySQL (Last Resort)
```bash
brew uninstall mysql
brew install mysql
brew services start mysql
mysql_secure_installation
```

## Current Configuration
The server is configured to use:
- Username: `root`
- Password: `password`
- Database: `shopee_clone`

After setting up MySQL, you can create the database:
```sql
CREATE DATABASE shopee_clone;
```

## Test Connection
After setup, test with:
```bash
mysql -u root -ppassword -e "SELECT 'Success!' as status;"
```
