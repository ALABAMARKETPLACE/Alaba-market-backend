# Database Seeding Guide

This guide explains how to seed your database with test data for orders and notifications to test all interactions.

## 📋 Available Seed Files

### 1. **seed-all.sql** (RECOMMENDED - Complete Solution)

- Combines orders and notifications seeding in one file
- Includes setup verification and error handling
- Provides summary statistics after completion
- **Use this file for comprehensive testing**

### 2. **seed-orders.sql**

- Seeds 8 different orders with various statuses
- Includes pending, accepted, in-transit, delivered, cancelled, failed orders
- Creates realistic tracking history for each order
- Use individually if you only want to seed orders

### 3. **seed-notifications-extended.sql**

- Seeds comprehensive notifications for all user types (buyer, seller, driver)
- Covers all notification types: order, driver, system, payment, invitation, alert
- Uses realistic messaging and timestamps
- Use individually if you only want to seed notifications

## 🚀 How to Use

### Option 1: Using psql (Command Line)

```bash
# Navigate to the project directory
cd /Users/macbook/Desktop/delivery-app/new-alaba-marketplace

# Run the complete seed script
psql -U your_username -d your_database_name -f seed-all.sql

# Or run individual files
psql -U your_username -d your_database_name -f seed-orders.sql
psql -U your_username -d your_database_name -f seed-notifications-extended.sql
```

### Option 2: Using Database Admin Tool (pgAdmin, DBeaver, etc.)

1. Open your database admin tool
2. Connect to your database
3. Open the SQL query editor
4. Copy & paste the contents of `seed-all.sql`
5. Execute the script
6. Review the output messages

### Option 3: Using Node.js Script

If you want to run seeds programmatically:

```typescript
import { execSync } from 'child_process';

const seedDatabase = () => {
  try {
    console.log('Starting database seeding...');

    execSync(`psql -U ${process.env.DB_USER} -d ${process.env.DB_NAME} -f seed-all.sql`, {
      stdio: 'inherit',
    });

    console.log('Database seeding completed!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

seedDatabase();
```

### Option 4: Using Docker (if your database is containerized)

```bash
# Copy the seed file into the container
docker cp seed-all.sql postgres-container:/tmp/

# Execute it in the container
docker exec postgres-container psql -U your_username -d your_database_name -f /tmp/seed-all.sql
```

## 📊 What Gets Seeded

### Orders (8 test orders)

| Status            | Quantity | Details                                       |
| ----------------- | -------- | --------------------------------------------- |
| PENDING           | 1        | Just placed, waiting for payment              |
| ACCEPTED          | 1        | Accepted by delivery company, awaiting driver |
| IN_TRANSIT        | 1        | Driver assigned and on the way                |
| DELIVERED         | 1        | Successfully delivered                        |
| CANCELLED         | 1        | Cancelled by buyer                            |
| FAILED            | 1        | Delivery attempt failed                       |
| PENDING (Payment) | 1        | Multiple items ordered                        |
| ACCEPTED (Ready)  | 1        | Ready for driver pickup                       |

### Notifications (~20+ notifications)

**For Buyers:**

- New order confirmations
- Order acceptance notifications
- Driver assignment alerts
- Delivery completion notifications
- Payment confirmations
- System updates
- Order cancellations

**For Sellers:**

- New order received
- Order acceptance by delivery company
- Payment received notifications
- Low stock alerts
- Order cancellations

**For Drivers:**

- New delivery assignments
- Delivery completion confirmations
- Daily earnings summaries
- Bonus notifications
- Profile update reminders
- Rating alerts

## ✅ Prerequisites

Before running the seed script, ensure:

1. **Database is running** and accessible
2. **PostgreSQL client (psql)** is installed on your system
3. **At least one user of each role exists:**
   - BUYER role
   - SELLER role
   - Optional: DRIVER role
   - Optional: DELIVERY_COMPANY role
4. **At least one product exists** in your database
5. **At least one delivery company exists** in your database

### Quick Check: Verify Required Data

```sql
-- Check if users exist
SELECT role, COUNT(*) FROM users GROUP BY role;

-- Check if products exist
SELECT COUNT(*) as product_count FROM products;

-- Check if delivery companies exist
SELECT COUNT(*) as delivery_company_count FROM "deliveryCompanies";
```

If any are missing, create them first before running the seed.

## 🔧 Creating Test Users (if needed)

```sql
-- Create test buyer
INSERT INTO users (email, password, "firstName", "lastName", phone, role, address)
VALUES (
  'buyer@test.com',
  '$2b$10$YourHashedPasswordHere', -- Use bcrypt hashed password
  'Test',
  'Buyer',
  '+2341234567890',
  'BUYER',
  'Lagos, Nigeria'
);

-- Create test seller
INSERT INTO users (email, password, "firstName", "lastName", phone, role, address)
VALUES (
  'seller@test.com',
  '$2b$10$YourHashedPasswordHere',
  'Test',
  'Seller',
  '+2349876543210',
  'SELLER',
  'Lagos, Nigeria'
);

-- Create test driver
INSERT INTO users (email, password, "firstName", "lastName", phone, role, address)
VALUES (
  'driver@test.com',
  '$2b$10$YourHashedPasswordHere',
  'Test',
  'Driver',
  '+2348765432109',
  'DRIVER',
  'Lagos, Nigeria'
);
```

## 📈 Testing Scenarios

With the seeded data, you can test:

### Order Workflow

- [ ] Order status progression (PENDING → ACCEPTED → IN_TRANSIT → DELIVERED)
- [ ] Order acceptance from marketplace
- [ ] Driver assignment to orders
- [ ] Tracking history updates
- [ ] Failed/cancelled orders handling

### Notifications

- [ ] Receiving notifications for different order statuses
- [ ] Notification filtering by type
- [ ] Marking notifications as read
- [ ] Notification pagination
- [ ] Push notification delivery

### Real-time Features

- [ ] WebSocket updates for order status changes
- [ ] Real-time notification delivery
- [ ] Driver location tracking updates
- [ ] Multiple user interactions simultaneously

### Network Reliability (if using reliability services)

- [ ] Order acceptance with network interruption
- [ ] Driver assignment with network failures
- [ ] Offline queue processing
- [ ] Automatic retry on reconnect

## 🔄 Resetting Data

To clear all seeded data and start fresh:

```sql
-- CAUTION: This deletes all data!

DELETE FROM notifications;
DELETE FROM "deliveryLogs";
DELETE FROM orders;
DELETE FROM drivers;
DELETE FROM "deliveryCompanies";
DELETE FROM products;
DELETE FROM users;

-- Reset auto-increment if using serial IDs
ALTER SEQUENCE users_id_seq RESTART;
```

Or just delete specific records:

```sql
-- Delete only test data (orders and notifications created after a specific time)
DELETE FROM notifications WHERE "createdAt" > '2025-12-11'::date;
DELETE FROM orders WHERE "createdAt" > '2025-12-11'::date;
```

## 📝 Customizing Seed Data

To modify the seed data:

1. Open the desired SQL file (`seed-all.sql`, `seed-orders.sql`, or `seed-notifications-extended.sql`)
2. Edit the VALUES sections for orders or notifications
3. Adjust quantities, prices, messages, statuses, etc.
4. Save the file
5. Re-run the seed script

### Example: Changing order quantity

```sql
-- Original
quantity, "unitPrice", "totalPrice", "deliveryFee", status, "paymentStatus",
2, 50.00, 100.00, 10.00, 'PENDING', 'PENDING',

-- Modified (change quantity from 2 to 5)
quantity, "unitPrice", "totalPrice", "deliveryFee", status, "paymentStatus",
5, 50.00, 250.00, 10.00, 'PENDING', 'PENDING',
```

## 🐛 Troubleshooting

### Error: "Permission denied" or "Access denied"

```bash
# Make sure you're using the correct credentials
psql -U postgres -d your_database_name -f seed-all.sql

# Or set environment variables
export PGUSER=your_username
export PGPASSWORD=your_password
psql -d your_database_name -f seed-all.sql
```

### Error: "No such file or directory"

```bash
# Make sure you're in the correct directory
cd /Users/macbook/Desktop/delivery-app/new-alaba-marketplace

# Verify the file exists
ls seed-all.sql

# Run with full path
psql -U your_username -d your_database_name -f /Users/macbook/Desktop/delivery-app/new-alaba-marketplace/seed-all.sql
```

### Error: "relation 'users' does not exist"

- Make sure your database migrations have been run
- Check that the tables exist: `\dt` in psql
- Run migrations before seeding

### Error: "Missing required data"

- The script will tell you which data is missing
- Create the required users, products, or delivery companies first
- Refer to "Creating Test Users" section above

## 📊 Verifying Seeded Data

After running the seed script:

```sql
-- Count total orders
SELECT COUNT(*) as total_orders FROM orders;

-- Count orders by status
SELECT status, COUNT(*) FROM orders GROUP BY status;

-- Count total notifications
SELECT COUNT(*) as total_notifications FROM notifications;

-- Count unread notifications
SELECT COUNT(*) as unread_notifications FROM notifications WHERE "isRead" = false;

-- See all orders with their tracking
SELECT id, status, "buyerId", "deliveryCompanyId", "trackingHistory" FROM orders;

-- See all notifications
SELECT "userId", title, type, "isRead", "createdAt" FROM notifications ORDER BY "createdAt" DESC;
```

## 🎯 Next Steps

Once data is seeded:

1. **Test the delivery app** - Place and manage orders
2. **Test notifications** - Check if notifications are received properly
3. **Test network reliability** - Simulate network interruptions during order acceptance
4. **Test real-time features** - Verify WebSocket updates work
5. **Test API endpoints** - Use the seeded data to test your APIs

## 📚 File Locations

All seed files are located in:

```
/Users/macbook/Desktop/delivery-app/new-alaba-marketplace/
├── seed-all.sql                      (Complete solution)
├── seed-orders.sql                   (Orders only)
├── seed-notifications-extended.sql   (Notifications only)
└── SEEDING_GUIDE.md                  (This file)
```

## 💡 Tips

1. **Always backup your database** before running seed scripts
2. **Run seed scripts only on development databases**, not production
3. **Use `seed-all.sql`** for fastest, most comprehensive setup
4. **Check the output** - Scripts provide useful summary statistics
5. **Customize as needed** - Edit the SQL files to match your test scenarios
6. **Run multiple times** - Safe to run again; uses standard INSERT statements

## ✨ Summary

You now have three comprehensive seed files ready to use:

- **seed-all.sql** - Complete solution with orders and notifications
- **seed-orders.sql** - Orders with different statuses
- **seed-notifications-extended.sql** - Comprehensive notifications

Choose your preferred method, follow the instructions above, and start testing! 🚀
