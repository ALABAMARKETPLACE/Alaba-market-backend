# Alaba Marketplace API - Quick Start Guide

Get up and running with the Alaba Marketplace API in 5 minutes.

---

## Prerequisites

- Node.js v16+ installed
- PostgreSQL database running
- Postman (for testing API)
- API credentials (JWT tokens)

---

## 1️⃣ Installation & Setup (Backend)

```bash
# Clone repository
git clone <repository-url>
cd alaba-marketplace-backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Configure your database and keys in .env
```

### Required Environment Variables
```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password
DATABASE_DATABASE=alaba_marketplace_dev
JWT_SECRET=your-secret-key
PAYSTACK_SECRET_KEY=sk_test_xxxxx
```

### Start Development Server
```bash
# Start with hot reload
npm run startdev

# Or regular start
npm start
```

Server runs on `http://localhost:8000`

---

## 2️⃣ Import Postman Collection

1. **Open Postman** desktop app
2. Click **File** → **Import**
3. Select **alaba-marketplace-postman-collection.json**
4. Collection imported with all endpoints organized by module

---

## 3️⃣ Quick Authentication Flow

### Step 1: Sign Up
```
POST /auth/signup
Body:
{
  "email": "yourname@example.com",
  "phone": "+2348012345678",
  "password": "Password123!",
  "first_name": "Your",
  "last_name": "Name",
  "username": "yourname"
}
```

### Step 2: Copy Token
From response, copy the `token` value.

### Step 2.5: Forgot or Reset Password (optional)
If you forget your password, use the following endpoints:

```http
POST /auth/forgot-password
Body: { "email": "yourname@example.com" }
```

A reset link will be emailed. After clicking it, call:

```http
POST /auth/reset-password
Body: { "token": "link_token", "password": "NewPassword123!" }
```

No token is required for these routes.

### Step 3: Set Postman Variable
1. Click **Environment** (top-right)
2. Select **Edit** next to your environment
3. Set `authToken` = (paste token)
4. Click **Save**

✅ Now all protected endpoints auto-include your token!

---

## 4️⃣ Test Your First Request

### A. Get User Profile
```
GET /user/refresh-user
Headers: Authorization: Bearer {{authToken}}
```

**Expected Response (200):**
```json
{
  "status": true,
  "message": "Success",
  "data": {
    "_id": 1,
    "email": "yourname@example.com",
    "username": "yourname",
    "first_name": "Your",
    "last_name": "Name",
    "phone": "+2348012345678"
  }
}
```

### B. Check Email Availability (No Auth)
```
GET /auth/checkEmail/test@example.com
```

### C. Get Categories
```
GET /category/all
```

---

## 5️⃣ Common API Workflows

### Workflow 1: Search & Browse Products

```
1. GET /category/all
   → Get all product categories

2. GET /product_search/all?query=laptop&category=1
   → Search products

3. GET /productsReviews/product/1
   → View product reviews
```

### Workflow 2: Place an Order (Customer)

```
1. POST /auth/login
   → Get authentication token

2. GET /address/all
   → View saved addresses

3. POST /address/create (if needed)
   → Add delivery address

4. POST /cart/create
   → Add item to cart

5. POST /order/create
   → Create order from cart

6. POST /paystack/initialize
   → Get payment link

7. GET /paystack/verify/:reference
   → Verify payment after completion
```

### Workflow 3: Become a Seller

```
1. POST /auth/signup
   → Create user account

2. POST /coorporate_store/create
   → Create store

3. POST /products/create
   → Add products

4. GET /coorporate_store/dashboard/admin
   → View store analytics
```

---

## 📋 Essential Endpoints Reference

### 🔓 No Authentication Required
| Endpoint | Use |
|----------|-----|
| `POST /auth/signup` | Create account |
| `POST /auth/login` | Login |
| `GET /auth/checkEmail/:email` | Verify email available |
| `GET /category/all` | Browse categories |
| `GET /product_search/all` | Search products |
| `GET /productsReviews/product/:id` | View reviews |

### 🔐 Authentication Required
| Endpoint | Use |
|----------|-----|
| `GET /user/refresh-user` | Get my profile |
| `GET /order/all` | My orders |
| `POST /order/create` | Place order |
| `GET /cart/all` | My cart |
| `POST /cart/create` | Add to cart |
| `GET /address/all` | My addresses |

---

## 🔧 Troubleshooting

### Login Failed
- ❌ "Invalid email or password"
  - Check email/password spelling
  - Reset password if forgotten
  - Ensure account exists

### Token Errors
- ❌ "Invalid token"
  - Token may be expired (log in again)
  - Check token format in header
  - Verify token has `Bearer ` prefix

### Database Connection Error
```
Error: Database connection lost
```
- Check PostgreSQL is running
- Verify DATABASE_HOST in .env
- Check DATABASE_PASSWORD matches

### CORS Error
```
Access to XMLHttpRequest blocked by CORS policy
```
- Frontend domain must be in allowedOrigins
- Check src/main.ts CORS configuration
- Add your domain to the whitelist

---

## 🚀 Next Steps

1. **Explore the Collection:** Review all endpoints in Postman
2. **Read Full Docs:** Check [`API_DOCUMENTATION.md`](./API_DOCUMENTATION.md)
3. **Setup Environment Variables:** Configure all required .env vars
4. **Test Workflows:** Try the workflows above
5. **Integrate Frontend:** Connect your web/mobile app

---

## 📚 Documentation Files

- **`API_DOCUMENTATION.md`** - Complete API reference
- **`alaba-marketplace-postman-collection.json`** - Postman collection
- **`README.md`** - Project overview
- **`.env.example`** - Environment variable template

---

## 💡 Tips & Tricks

### Postman Tips
- Use **Tests** tab to auto-set variables after requests
- Use **Pre-request Script** for dynamic data
- Create **Postman Environments** for dev/staging/production
- Use **Collections Runner** for batch testing

### Example: Auto-set Token After Login
In `Tests` tab of login endpoint:
```javascript
var jsonData = pm.response.json();
pm.environment.set("authToken", jsonData.data.token);
```

### Pagination
Most list endpoints support pagination:
```
GET /order/all?page=1&take=10
```
- `page`: Page number (starts at 1)
- `take`: Items per page (default 10)

### Error Handling
Always check response status and error message:
```json
{
  "statusCode": 400,
  "message": "Invalid input format",
  "path": "/api/endpoint"
}
```

---

## 🆘 Getting Help

### Check These First:
1. HTTP Status Code indicates the type of error (4xx = client error, 5xx = server error)
2. Error message describes what went wrong
3. Check `.env` configuration matches your setup
4. Ensure JWT token is included for protected endpoints

### Debug Mode:
Add logging to see request/response details in Postman:
```
console.log(pm.request);
console.log(pm.response.json());
```

---

## 📞 Support Channels

- **Documentation:** Read API_DOCUMENTATION.md
- **Issues:** Check error messages and status codes
- **Logs:** Check server console output
- **Database:** Verify PostgreSQL connectivity

---

**Happy API Testing! 🎉**

For more detailed information, see [`API_DOCUMENTATION.md`](./API_DOCUMENTATION.md)

---

*Last Updated: March 3, 2026*
