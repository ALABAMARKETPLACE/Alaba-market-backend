# BOOST_REQUESTS Module

## 📦 Module Structure

```
BOOST_REQUESTS/
├── dto/
│   ├── create-boost-request.dto.ts
│   ├── update-boost-request.dto.ts
│   ├── boost-request.dto.ts
│   ├── get-all-boost-requests.dto.ts
│   └── approve-boost-request.dto.ts
├── boost-request.entity.ts
├── boost-request.service.ts
├── boost-request.controller.ts
├── boost-request.module.ts
├── boost-request.provider.ts
└── README.md
```

---

## 📋 Features Implemented

### ✅ Complete CRUD Operations

- **POST** `/boost-requests` - Create new boost request
- **GET** `/boost-requests` - Get all with pagination, search, filters
- **GET** `/boost-requests/:id` - Get single request
- **PUT** `/boost-requests` - Update boost request
- **DELETE** `/boost-requests/:id` - Soft delete
- **POST** `/boost-requests/approve` - Approve/Reject request

### ✅ Entity Features

- Soft delete (`paranoid: true`)
- Relationships:
  - `seller_id` → `INDIVIDUAL_SELLER.id`
  - `plan_id` → `SUBSCRIPTION_PLANS.id`
  - `product_ids` → JSON array of `PRODUCTS._id`
- Status: `pending`, `approved`, `rejected`, `expired`
- Audit trail: `last_updated_by`, timestamps

### ✅ Validations

- Plan ID must exist and be active
- Product count must be within plan's min/max limits
- All product IDs must be valid
- Only pending requests can be updated
- Seller can only update their own requests

### ✅ Auto-Calculations

- **total_amount** = `product_ids.length × plan.price` (price is per product for the plan duration)
- Recalculated automatically on update

### ✅ Search & Filters

- **Search**: Seller name (case-insensitive)
- **Filters**:
  - `status`: pending/approved/rejected/expired/all
  - `seller_id`: Specific seller
  - `plan_id`: Specific plan
- **Pagination**: page, limit

### ✅ Response Includes

- Seller details (id, name, email, phone)
- Plan details (id, name, min/max products, price)
- Product details (id, name, image, price, sku)

---

## 🔐 Permissions

### Seller (`Role.Seller`)

- ✅ Create boost requests
- ✅ View all boost requests (can be filtered by seller_id)
- ✅ View single boost request
- ✅ Update own boost requests (only if status is pending)

### Admin (`Role.Admin`)

- ✅ View all boost requests
- ✅ View single boost request
- ✅ Delete boost requests (soft delete)
- ✅ Approve/Reject boost requests

---

## 📝 API Endpoints

### 1. Create Boost Request

```
POST /boost-requests
Authorization: Bearer <token>
Role: Seller

Body:
{
  "plan_id": 1,
  "product_ids": [1, 2, 3],
  "days": 10,
  "remarks": "Optional remarks"
}

Response:
{
  "data": {
    "id": 1,
    "seller_id": 1,
    "plan_id": 1,
    "product_ids": [1, 2, 3],
    "days": 10,
    "total_amount": 450.00,
    "status": "pending",
    "requested_at": "2024-01-15T10:30:00Z",
    ...
  },
  "success": true,
  "message": "Boost request created successfully"
}
```

### 2. Get All Boost Requests

```
GET /boost-requests?page=1&limit=10&search=john&status=pending
Authorization: Bearer <token>
Role: Seller, Admin

Response:
{
  "data": {
    "data": [...],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 10,
      "totalPages": 5
    }
  },
  "success": true,
  "message": "Successfully Retrieved"
}
```

### 3. Get Single Boost Request

```
GET /boost-requests/:id
Authorization: Bearer <token>
Role: Seller, Admin

Response includes seller, plan, and products details
```

### 4. Update Boost Request

```
PUT /boost-requests
Authorization: Bearer <token>
Role: Seller

Body:
{
  "id": 1,
  "plan_id": 2,  // optional
  "product_ids": [1, 2, 3, 4],  // optional
  "days": 15,  // optional
  "remarks": "Updated remarks"  // optional
}

Note: Only pending requests can be updated
```

### 5. Delete Boost Request

```
DELETE /boost-requests/:id
Authorization: Bearer <token>
Role: Admin

Soft delete - sets deleted_at timestamp
```

### 6. Approve/Reject Boost Request

```
POST /boost-requests/approve
Authorization: Bearer <token>
Role: Admin

Body:
{
  "id": 1,
  "status": "approved",  // or "rejected"
  "remarks": "Approved for promotion"  // optional
}

On approval:
- Sets approved_at = current date
- Sets start_date = current date
- Sets end_date = start_date + days
```

---

## 🔄 Business Logic

### Create Flow

1. Validate plan exists and is active
2. Validate product count is within plan's min/max
3. Validate all product IDs exist
4. Calculate total_amount automatically
5. Set status = "pending"
6. Set requested_at = current date

### Update Flow

1. Only allow if status = "pending"
2. Only allow seller to update their own requests
3. If plan changes, re-validate product count
4. If products change, validate count and existence
5. Recalculate total_amount automatically

### Approval Flow

1. Only allow if status = "pending"
2. If approved:
   - Set approved_at = now
   - Set start_date = now
   - Set end_date = start_date + days
3. If rejected:
   - Just update status

---

## 🚨 Important Notes

### TODO: Seller/Admin ID from Token

Currently using placeholder IDs (sellerId = 1, adminId = 1).

You need to:

1. Create a decorator like `@SellerId()` or use existing user decorator
2. Extract seller_id from JWT token in controller
3. Replace placeholders in controller methods

Example:

```typescript
@Post()
create(
  @Body() createDto: CreateBoostRequestDto,
  @SellerId() sellerId: number  // Get from token
): Promise<DataResponseDto> {
  return this.boostRequestService.create(sellerId, createDto);
}
```

---

## 🗄️ Database

### Table: `BOOST_REQUESTS`

```sql
CREATE TABLE BOOST_REQUESTS (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  seller_id BIGINT NOT NULL,
  plan_id BIGINT NOT NULL,
  product_ids JSON NOT NULL,
  days INTEGER NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status ENUM('pending','approved','rejected','expired') DEFAULT 'pending',
  requested_at DATETIME,
  approved_at DATETIME,
  start_date DATETIME,
  end_date DATETIME,
  remarks TEXT,
  last_updated_by BIGINT,
  createdAt DATETIME,
  updatedAt DATETIME,
  deleted_at DATETIME,
  FOREIGN KEY (seller_id) REFERENCES INDIVIDUAL_SELLER(id),
  FOREIGN KEY (plan_id) REFERENCES SUBSCRIPTION_PLANS(id)
);
```

---

## ✅ Integration Completed

- ✅ Entity added to `database.providers.ts`
- ✅ Module added to `app.module.ts`
- ✅ Dependencies: SubscriptionPlanModule, ProductsModule
- ✅ Exports providers for other modules to use

---

## 🧪 Testing Examples

### Test Case 1: Create with valid data

```bash
POST /boost-requests
{
  "plan_id": 1,  # Silver plan: 1-10 products, ₦15/day
  "product_ids": [101, 102, 103],  # 3 products
  "days": 10
}
# Expected: total_amount = 3 × 10 × 15 = ₦450
```

### Test Case 2: Validation error - too many products

```bash
POST /boost-requests
{
  "plan_id": 1,  # Silver plan: max 10 products
  "product_ids": [1,2,3,4,5,6,7,8,9,10,11],  # 11 products
  "days": 10
}
# Expected: BadRequestException
```

### Test Case 3: Update rejected - not pending

```bash
PUT /boost-requests
{
  "id": 5,  # Status is already "approved"
  "days": 20
}
# Expected: BadRequestException
```

---

## 📞 Next Steps

1. **Add user authentication decorator** to extract sellerId/adminId from token
2. **Test all endpoints** with actual data
3. **Create database migration** for BOOST_REQUESTS table
4. **Implement BOOSTED_PRODUCTS** module (next phase)
5. **Add cron job** for auto-expiry logic

---

## 🎉 Module Complete!

All CRUD operations, validations, and business logic are implemented and ready for testing!
