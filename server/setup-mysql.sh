#!/bin/bash

echo "🔧 Setting up MySQL for Shopee Clone..."
echo ""

# Stop MySQL service
echo "Stopping MySQL service..."
brew services stop mysql

# Wait a moment
sleep 2

# Start MySQL in safe mode
echo "Starting MySQL in safe mode..."
sudo mysqld_safe --skip-grant-tables --skip-networking &
SAFE_PID=$!

# Wait for MySQL to start
sleep 5

# Reset password
echo "Resetting MySQL root password..."
mysql -u root <<EOF
FLUSH PRIVILEGES;
ALTER USER 'root'@'localhost' IDENTIFIED BY 'password';
FLUSH PRIVILEGES;
EOF

# Kill safe mode MySQL
sudo kill $SAFE_PID

# Wait a moment
sleep 2

# Start MySQL normally
echo "Starting MySQL normally..."
brew services start mysql

# Wait for MySQL to start
sleep 3

# Test connection
echo "Testing connection..."
mysql -u root -ppassword -e "SELECT 'Connection successful!' as status;"

if [ $? -eq 0 ]; then
    echo "✅ MySQL setup completed successfully!"
    echo "Password is set to: password"
else
    echo "❌ Setup failed. Please try manual setup."
fi
