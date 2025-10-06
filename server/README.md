# Shopee Clone Backend Server

Node.js backend server with MySQL database for the Shopee clone application.

## Setup Instructions

### 1. Database Setup
Make sure you have MySQL installed and running on your system.

Create a database:
```sql
CREATE DATABASE shopee_clone;
```

### 2. Environment Configuration
Copy the environment file and update with your database credentials:
```bash
cp .env.example .env
```

Update the `.env` file with your MySQL credentials:
- `DB_PASSWORD`: Your MySQL root password
- `JWT_SECRET`: A secure random string for JWT tokens

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Database Migrations
```bash
npm run migrate
```

### 5. Start the Server
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will run on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### User Management
- `GET /api/user/me` - Get user profile (requires auth)
- `PUT /api/user/me` - Update user profile (requires auth)
- `PUT /api/user/change-password` - Change password (requires auth)

### Products
- `GET /api/products` - Get products with filters and pagination
- `GET /api/products/:id` - Get product by ID

### Categories
- `GET /api/categories` - Get all categories

### Health Check
- `GET /api/health` - Server health status

## Database Schema

### Users Table
- id, email, password, name, phone, address, date_of_birth, avatar, roles, verify

### Products Table
- id, name, description, category_id, image, images, price, price_before_discount, quantity, sold, view, rating

### Categories Table
- id, name

### Purchases Table
- id, user_id, buy_count, price, price_before_discount, status, product_id
