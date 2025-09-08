Deployment (netify + Railway)
1. push code lên github
2. vào railway tạo data base mysql 
    => vào setting/networking/publicnetwork
    => lấy mysql_url trong vars
3. tiếp tục create project import từ github
    => settings / source / directory chọn server
    => deploy / custom start command  nhập 'npm run migrate && npm start'
    => env
CORS_ORIGIN
DB_HOST
DB_NAME
DB_PASSWORD
DB_PORT
DB_USER
FRONTEND_URL
JWT_EXPIRES_IN = 7d
JWT_SECRET = shopee_clone_jwt_secret_key_2024 
PORT = 8080
STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET

=> vào setting/networking/publicnetwork
=> lấy be url

4. Vào netify tạo project lấy từ github
VITE_API_URL = 
VITE_STRIPE_PUBLISHABLE_KEY