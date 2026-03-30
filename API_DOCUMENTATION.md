# Alaba Marketplace API Documentation

**Version:** 1.0.0  
**Last Updated:** March 3, 2026  
**Base URL:** `http://localhost:8000`

---

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [API Endpoints](#api-endpoints)
4. [Postman Setup](#postman-setup)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [Examples](#examples)

---

## Overview

Alaba Marketplace API is a comprehensive RESTful API for an e-commerce platform built with NestJS, Sequelize, and PostgreSQL. The API supports:

- **User Management:** Registration, authentication, profile management
- **Store Management:** Store creation, configuration, dashboard analytics
- **Product Management:** CRUD operations, search, categorization
- **Order Management:** Order placement, status tracking, cancellation
- **Payment Processing:** Paystack integration for payments
- **Shopping Features:** Cart, wishlist, reviews
- **Delivery Management:** Shipping charges, delivery tracking
- **Admin & Analytics:** Dashboard, settlements, reports

---

## Authentication

### Overview
The API uses **JWT (JSON Web Tokens)** for authentication. All protected endpoints require an `Authorization` header with a Bearer token.

### Token Structure
```
Authorization: Bearer <JWT_TOKEN>
```

### Obtaining a Token

#### 1. Sign Up (New User)
```http
POST /auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "phone": "+2348012345678",
  "password": "SecurePassword@123",
  "first_name": "John",
  "last_name": "Doe",
  "username": "johndoe"
}
```

**Response:**
```json
{
  "status": true,
  "message": "Account created successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "_id": 1,
      "email": "user@example.com",
      "username": "johndoe"
    }
  }
}
```

#### 2. Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword@123"
}
```

#### 3. Refresh Token
```http
POST /auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### 4. Check Email Availability
```http
GET /auth/checkEmail/user@example.com
```

#### 5. Check Phone Availability
```http
GET /auth/checkphone/2348012345678
```

### Token Expiration
- **Access Token:** Varies by role (default: 7 days)
- **Admin:** Longer session (configurable via `SESSION_EXPIRY_ADMIN`)
- **Seller:** Medium session (configurable via `SESSION_EXPIRY_SELLER`)
- **User:** Standard session (configurable via `SESSION_EXPIRY`)

---

## API Endpoints

### 🔐 Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------|
| POST | `/auth/signup` | Register new user | ❌ No |
| POST | `/auth/login` | Login with email/password | ❌ No |
| POST | `/auth/forgot-password` | Request password reset link | ❌ No |
| POST | `/auth/reset-password` | Reset password using token | ❌ No |
| GET | `/auth/checkEmail/:email` | Check email availability | ❌ No |
| GET | `/auth/checkphone/:phone` | Check phone availability | ❌ No |
| POST | `/auth/verify-email` | Verify email with token | ❌ No |
| POST | `/auth/email-verify` | Request email verification | ✅ Yes |
| POST | `/auth/refresh-token` | Refresh access token | ❌ No |
| GET | `/auth/signout` | Sign out current device | ✅ Yes |
| GET | `/auth/signoutall` | Sign out all devices | ✅ Yes |

---

### 👤 User Management Endpoints

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|--------|-------|
| GET | `/user` | List all users (paginated) | ✅ Yes | Admin |
| GET | `/user/refresh-user` | Get current user data | ✅ Yes | All |
| GET | `/user/details/:id` | Get user details | ✅ Yes | Admin |
| POST | `/user/check_user/validate` | Check if user exists | ✅ Yes | All |
| PUT | `/user/update-name` | Update first/last name | ✅ Yes | All |
| PUT | `/user/update-email` | Update email address | ✅ Yes | All |
| PUT | `/user/update-Phone` | Update phone number | ✅ Yes | All |
| PUT | `/user/update-password` | Update password | ✅ Yes | All |
| PUT | `/user/add-password` | Add password (OAuth) | ✅ Yes | All |
| PUT | `/user/update-photo` | Update profile picture | ✅ Yes | All |
| PUT | `/user/deactivate` | Deactivate account | ✅ Yes | All |
| PUT | `/user/reactivate/:id` | Reactivate user | ✅ Yes | Admin |

---

### 🏪 Store Management Endpoints

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|--------|-------|
| GET | `/coorporate_store/store_check` | Check if user owns store | ✅ Yes | All |
| GET | `/coorporate_store/account/details` | Get store details | ✅ Yes | Seller |
| PUT | `/coorporate_store/account/details` | Update store details | ✅ Yes | Seller |
| GET | `/coorporate_store/details` | Get full store info | ✅ Yes | Seller |
| GET | `/coorporate_store/dashboard/admin` | Get admin dashboard | ✅ Yes | Admin |
| POST | `/coorporate_store/create` | Create new store | ✅ Yes | User |

---

### 📦 Product Endpoints

| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|--------|-------|
| GET | `/products/bystore` | Get seller's products | ✅ Yes | Seller |
| GET | `/products/bystore/:storeId` | Get store products | ❌ No | All |
| GET | `/products/seller/:id` | Get product for editing | ✅ Yes | Seller |
| POST | `/products/create` | Create new product | ✅ Yes | Seller |
| PUT | `/products/:id` | Update product | ✅ Yes | Seller |
| DELETE | `/products/:id` | Delete product | ✅ Yes | Seller |

**Query Parameters for Product Listing:**
- `page` (number): Page number (default: 1)
- `take` (number): Items per page (default: 10)
- `query` (string): Search term
- `status` (string): Product status (active/inactive)
- `category` (number): Category ID
- `subCategory` (number): Sub-category ID

---

### 🛒 Order Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------|
| GET | `/order/all` | Get user orders | ✅ Yes |
| GET | `/order/:id` | Get order details | ✅ Yes |
| POST | `/order/create` | Create new order | ✅ Yes |
| PUT | `/order/cancel/:id` | Cancel order | ✅ Yes |

**Order Creation Payload:**
```json
{
  "items": [
    {
      "product_id": 1,
      "quantity": 2,
      "price": 5000
    }
  ],
  "address_id": 1,
  "delivery_type": "home",
  "payment_method": "card"
}
```

---

### 💳 Payment Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------|
| POST | `/paystack/initialize` | Initialize Paystack payment | ✅ Yes |
| GET | `/paystack/verify/:reference` | Verify payment | ✅ Yes |
| GET | `/payments` | Get payment history | ✅ Yes |

---

### 📮 Cart & Wishlist Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------|
| GET | `/cart/all` | Get cart items | ✅ Yes |
| POST | `/cart/create` | Add to cart | ✅ Yes |
| PUT | `/cart/:id` | Update cart item | ✅ Yes |
| DELETE | `/cart/:id` | Remove from cart | ✅ Yes |
| GET | `/wishlist/all` | Get wishlist | ✅ Yes |
| POST | `/wishlist/create` | Add to wishlist | ✅ Yes |
| DELETE | `/wishlist/:id` | Remove from wishlist | ✅ Yes |

---

### 🏷️ Category & Search Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------|
| GET | `/category/all` | Get all categories | ❌ No |
| GET | `/sub_category/all` | Get all subcategories | ❌ No |
| GET | `/product_search/all` | Search products | ❌ No |
| GET | `/store_search/all` | Search stores | ❌ No |

---

### ⭐ Review Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------|
| GET | `/productsReviews/product/:productId` | Get product reviews | ❌ No |
| POST | `/productsReviews/create` | Create product review | ✅ Yes |
| GET | `/storereview/:storeId` | Get store reviews | ❌ No |

---

### 📍 Address Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------|
| GET | `/address/all` | Get all addresses | ✅ Yes |
| GET | `/address/all/:id` | Get specific address | ✅ Yes |
| POST | `/address/create` | Create address | ✅ Yes |
| PUT | `/address/:id` | Update address | ✅ Yes |
| DELETE | `/address/:id` | Delete address | ✅ Yes |

**Address Payload:**
```json
{
  "fullname": "John Doe",
  "phone": "2348012345678",
  "street": "123 Main Street",
  "city": "Lagos",
  "state": "Lagos",
  "country": "Nigeria",
  "postalCode": "100001",
  "is_default": true
}
```

---

### 🚚 Delivery & Shipping Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------|
| GET | `/deliverycharge/all` | Get delivery charges | ❌ No |
| POST | `/deliverycharge/calculate` | Calculate shipping cost | ❌ No |

---

### 📊 Dashboard & Analytics Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------|
| GET | `/dashboard/overview` | Get dashboard data | ✅ Yes |
| GET | `/settlements/all` | Get settlements | ✅ Yes |

---

### 📝 Invoice Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------|
| POST | `/invoice/create` | Generate invoice | ✅ Yes |
| GET | `/invoice/:id` | Get invoice | ✅ Yes |
| GET | `/invoice/get/:token` | Get invoice (public) | ❌ No |

---

### 🔔 Notification Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------|
| GET | `/notifications/all` | Get notifications | ✅ Yes |
| PUT | `/notifications/:id/read` | Mark as read | ✅ Yes |

---

### 🎁 Promotions Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------|
| GET | `/offers/all` | Get active offers | ❌ No |
| GET | `/featured-products/all` | Get featured products | ❌ No |

---

## Postman Setup

### 1. Import Collection
1. Open Postman
2. Click **Import** → **Upload Files**
3. Select `alaba-marketplace-postman-collection.json`

### 2. Configure Environment Variables
The collection includes default variables:
- `{{baseUrl}}` - API base URL (default: `http://localhost:8000`)
- `{{authToken}}` - JWT token (set after login)
- `{{userId}}` - Current user ID
- `{{storeId}}` - Current store ID

### 3. Get Auth Token
1. Go to **Authentication** → **POST /auth/signup** or **POST /auth/login**
2. Execute the request
3. Copy the `token` from response
4. Set `{{authToken}}` variable with this token
5. Use `{{authToken}}` in Authorization header for protected endpoints

### 4. Set Custom Variables
```
baseUrl = http://localhost:8000
authToken = (obtained from login)
userId = (from user profile)
storeId = (from store creation)
```

---

## Error Handling

### Standard Error Response Format
```json
{
  "statusCode": 400,
  "message": "Error description",
  "path": "/api/endpoint",
  "timestamp": "2024-03-03T10:30:00.000Z"
}
```

### Common HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | ✅ OK - Request successful | GET request completed |
| 201 | ✅ Created - Resource created | POST created new record |
| 400 | ❌ Bad Request - Invalid input | Missing required fields |
| 401 | ❌ Unauthorized - No/invalid token | Missing JWT token |
| 403 | ❌ Forbidden - Insufficient permissions | User lacks required role |
| 404 | ❌ Not Found - Resource doesn't exist | Product ID not found |
| 409 | ❌ Conflict - Resource already exists | Email already registered |
| 500 | ❌ Server Error - Internal error | Database connection failed |

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid email format" | Email is malformed | Use valid email format |
| "Password must be at least 8 characters" | Weak password | Use stronger password |
| "Already Used" | Email/phone in use | Use different email/phone |
| "Please log in" | Missing token | Include Authorization header |
| "Unauthorized role" | Insufficient permissions | Verify user role |
| "Database Connection lost" | Backend issue | Restart server |

---

## Rate Limiting

⚠️ **Currently Not Implemented** - Rate limiting should be added in production.

**Recommended Configuration:**
- 100 requests per 15 minutes per IP address
- 10 payment requests per minute
- 30 search requests per minute

---

## Examples

### Example 1: Complete User Flow

#### Step 1: Sign Up
```bash
curl -X POST http://localhost:8000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "phone": "+2348012345678",
    "password": "SecurePass@123",
    "first_name": "John",
    "last_name": "Doe",
    "username": "johndoe"
  }'
```

#### Step 2: Get Token (from signup response)
```bash
# Extract token from response and set as variable
export TOKEN="eyJhbGciOiJIUzI1NiIs..."
```

#### Step 3: Verify Email
```bash
curl -X POST http://localhost:8000/auth/email-verify \
  -H "Authorization: Bearer $TOKEN"
```

#### Step 4: Get User Profile
```bash
curl -X GET http://localhost:8000/user/refresh-user \
  -H "Authorization: Bearer $TOKEN"
```

---

### Example 2: Create and Manage Products (Seller)

#### Step 1: Create Store (if new seller)
```bash
curl -X POST http://localhost:8000/coorporate_store/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "store_name": "My Store",
    "store_description": "Quality products",
    "business_type_id": 1
  }'
```

#### Step 2: Create Product
```bash
curl -X POST http://localhost:8000/products/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Laptop",
    "description": "High-performance laptop",
    "price": 250000,
    "quantity": 10,
    "category_id": 1,
    "subCategory_id": 5
  }'
```

#### Step 3: Get Products in Store
```bash
curl -X GET "http://localhost:8000/products/bystore?page=1&take=10" \
  -H "Authorization: Bearer $TOKEN"
```

---

### Example 3: Place Order (Customer)

#### Step 1: Add to Cart
```bash
curl -X POST http://localhost:8000/cart/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": 1,
    "quantity": 2
  }'
```

#### Step 2: Create Address
```bash
curl -X POST http://localhost:8000/address/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullname": "John Doe",
    "phone": "2348012345678",
    "street": "123 Main St",
    "city": "Lagos",
    "state": "Lagos",
    "country": "Nigeria",
    "is_default": true
  }'
```

#### Step 3: Create Order
```bash
curl -X POST http://localhost:8000/order/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "product_id": 1,
        "quantity": 2
      }
    ],
    "address_id": 1,
    "payment_method": "card"
  }'
```

#### Step 4: Initialize Payment
```bash
curl -X POST http://localhost:8000/paystack/initialize \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": 1,
    "amount": 500000
  }'
```

#### Step 5: Verify Payment
```bash
curl -X GET "http://localhost:8000/paystack/verify/transaction_reference" \
  -H "Authorization: Bearer $TOKEN"
```

---

### Example 4: Search Products

#### Public Search (No Auth Required)
```bash
curl -X GET "http://localhost:8000/product_search/all?page=1&take=20&query=laptop&category=1"
```

#### Search By Store
```bash
curl -X GET "http://localhost:8000/store_search/all?page=1&take=10&query=electronics"
```

---

## Environment Variables

Required `.env` file configuration:

```env
# Server
NODE_ENV=development
PORT=8000

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=password
DATABASE_DATABASE=alaba_marketplace_dev
DATABASE_SSL=false

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
SESSION_EXPIRY=7d
SESSION_EXPIRY_SELLER=14d
SESSION_EXPIRY_ADMIN=30d
VERIFY_EXPIRY=24h

# Paystack
PAYSTACK_SECRET_KEY=sk_test_xxxxx
PAYSTACK_PUBLIC_KEY=pk_test_xxxxx
PAYSTACK_TEST_SECRET_KEY=sk_test_xxxxx
PAYSTACK_TEST_PUBLIC_KEY=pk_test_xxxxx

# Email (Brevo)
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_USER=email@example.com
BREVO_SMTP_PASSWORD=api_key

# Firebase (Optional)
FIREBASE_PROJECT_ID=project-id
FIREBASE_PRIVATE_KEY=key
FIREBASE_CLIENT_EMAIL=email@firebase.com
```

---

## Best Practices

### Security
✅ Always use HTTPS in production
✅ Never expose API keys in client-side code
✅ Validate all user inputs
✅ Implement rate limiting
✅ Use strong JWT secrets
✅ Enable CORS only for trusted domains

### Performance
✅ Use pagination for list endpoints
✅ Cache frequently accessed data
✅ Implement request timeouts
✅ Use connection pooling for database

### Error Handling
✅ Include error codes for client handling
✅ Log errors with proper context
✅ Don't expose sensitive data in errors
✅ Provide helpful error messages

### Testing
✅ Test all endpoints with different roles
✅ Verify error responses
✅ Test pagination boundaries
✅ Test concurrent requests

### Guest Paystack Webhook Flow
Use this sequence for guest checkout if you want the webhook to create the order:

1. Call `POST /calculate_delivery/public`
2. Call `POST /paystack/initialize-guest` with `order_payload`
3. Redirect customer to Paystack checkout
4. Let Paystack call `POST /paystack/webhook`
5. Optionally keep `POST /paystack/verify-guest` and `POST /order/guest/orders` on the frontend as fallback/read model

Example `POST /paystack/initialize-guest` payload:

```json
{
  "guest_info": {
    "email": "guest@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "08000000000"
  },
  "cart_items": [
    {
      "product_id": 123,
      "store_id": 7,
      "quantity": 1,
      "unit_price": 50000
    }
  ],
  "amount": 50000,
  "delivery_charge": 2500,
  "callback_url": "https://your-frontend-domain.com/guest/payment/result",
  "order_payload": {
    "guest_info": {
      "email": "guest@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "phone": "08000000000"
    },
    "delivery_address": {
      "id": "guest_address_1",
      "full_name": "John Doe",
      "phone_no": "08000000000",
      "full_address": "123 Test Street",
      "city": "Lagos",
      "state": "Lagos",
      "state_id": 1,
      "country": "Nigeria",
      "country_id": 1
    },
    "cart_items": [
      {
        "product_id": 123,
        "store_id": 7,
        "product_name": "Sample Product",
        "quantity": 1,
        "unit_price": 500,
        "total_price": 500
      }
    ],
    "payment": {
      "payment_reference": "",
      "transaction_reference": "",
      "payment_status": "success"
    },
    "delivery": {
      "delivery_token": "SIGNED_DELIVERY_TOKEN"
    },
    "order_summary": {
      "total": 525
    }
  }
}
```

---

## Support & Troubleshooting

### Common Issues

**Issue: "Database connection lost"**
- Check if PostgreSQL is running
- Verify database credentials in `.env`
- Check database URL and port

**Issue: "Invalid token"**
- Ensure token hasn't expired
- Verify token format (Bearer prefix)
- Re-login to get fresh token

**Issue: "CORS error"**
- Check allowed origins in main.ts
- Verify frontend URL is whitelisted
- Check if credentials:true is set

**Issue: "Unauthorized role"**
- Verify user has correct role assigned
- Check role-based decorators on endpoints
- Ensure token contains role information

---

## API Versioning

Current version: **v1.0.0**

Future versions will be supported at:
- `/api/v1/` (current)
- `/api/v2/` (planned)

---

## Changelog

### v1.0.0 (March 2024)
- ✅ Initial API release
- ✅ Authentication system
- ✅ User management
- ✅ Product management  
- ✅ Order system
- ✅ Payment integration (Paystack)
- ✅ Cart & Wishlist
- ✅ Delivery management

---

**Last Updated:** March 3, 2026  
**Next Review:** June 3, 2026
