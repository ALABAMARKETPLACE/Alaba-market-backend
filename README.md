# Alaba Marketplace Backend

NestJS backend for Alaba Marketplace delivery management system.

## 🚀 Features

- ✅ JWT Authentication with refresh tokens
- ✅ Role-based authorization (5 roles)
- ✅ Secure barcode & delivery code system
- ✅ Paystack payment integration
- ✅ Real-time tracking (Socket.IO)
- ✅ Email notifications (Nodemailer)
- ✅ Subscription management with cron jobs
- ✅ File uploads (Multer + Sharp)
- ✅ Complete Swagger API documentation

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL 13+
- npm or yarn

## 🛠️ Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your actual values
```

## 🗄️ Database Setup

```bash
# Create database
createdb alaba_marketplace

# Or via psql
psql -U postgres
CREATE DATABASE alaba_marketplace;
\q

# Run migrations
npm run migration:run

# Seed database (optional - for test data)
npm run seed:run
```

## 🔧 Environment Variables

See `.env.example` for all required variables. Key ones:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=alaba_marketplace

JWT_SECRET=your-secret-key
PAYSTACK_SECRET_KEY=sk_test_xxx
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your-app-password
```

## 🚀 Running the App

```bash
# Development
npm run start:dev

# Production build
npm run build
npm run start:prod

# Debug mode
npm run start:debug
```

## 📚 API Documentation

Once running, visit: **http://localhost:3001/api/docs**

## 🧪 Testing

```bash
# Unit tests
npm test

# e2e tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📦 Available Scripts

```bash
npm run build          # Build the project
npm run start          # Start production server
npm run start:dev      # Start development server with watch
npm run start:debug    # Start with debug mode
npm run lint           # Lint and fix files
npm run format         # Format code with Prettier
npm run migration:generate  # Generate new migration
npm run migration:run       # Run migrations
npm run migration:revert    # Revert last migration
npm run seed:run           # Run seeders
npm run seed:revert        # Revert seeders
```

## 🔑 Test Credentials (After Seeding)

```
Admin:
- Email: admin@alaba.com
- Password: password123

Seller:
- Email: seller@alaba.com
- Password: password123

Buyer:
- Email: buyer@alaba.com
- Password: password123

Delivery Company:
- Email: delivery@alaba.com
- Password: password123

Driver:
- Email: driver@alaba.com
- Password: password123
```

## 📁 Project Structure

```
src/
├── common/              # Shared code (guards, decorators, filters)
├── config/              # Configuration files
├── modules/             # Feature modules
│   ├── auth/           # Authentication
│   ├── users/          # User management
│   ├── products/       # Product management
│   ├── orders/         # Order processing
│   ├── delivery-company/
│   ├── drivers/
│   ├── tracking/
│   ├── paystack/       # Payment integration
│   ├── subscription/
│   └── upload/
├── gateways/           # WebSocket gateways
├── database/           # Migrations & seeders
├── main.ts             # Application entry point
└── app.module.ts       # Root module
```

## 🔐 Security Features

- JWT tokens with refresh mechanism
- Password hashing with bcrypt
- Role-based access control
- Input validation
- SQL injection prevention (Sequelize ORM)
- CORS protection
- Helmet security headers
- Rate limiting ready

## 📡 API Endpoints

### Authentication
- POST `/api/v1/auth/register` - Register user
- POST `/api/v1/auth/login` - Login
- POST `/api/v1/auth/refresh` - Refresh token
- POST `/api/v1/auth/logout` - Logout

### Orders
- POST `/api/v1/orders` - Create order
- GET `/api/v1/orders/my-orders` - Get user orders
- POST `/api/v1/orders/:id/package-received` - Confirm package
- POST `/api/v1/orders/:id/confirm-delivery` - Confirm delivery

### Products
- GET `/api/v1/products` - List products
- POST `/api/v1/products` - Create product (seller)
- GET `/api/v1/products/:id` - Get product details

### Payment
- POST `/api/v1/paystack/initialize` - Initialize payment
- POST `/api/v1/paystack/verify` - Verify payment
- POST `/api/v1/webhooks/paystack` - Payment webhook

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -U postgres -d alaba_marketplace
```

### Migration Errors
```bash
# Reset database
npm run migration:revert
npm run migration:run
```

### Port Already in Use
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

## 📄 License

MIT

## 👥 Support

For issues or questions, check the API documentation at `/api/docs`