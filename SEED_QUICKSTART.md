# 🚀 Quick Start: Database Seeding

This is a quick reference guide to seed your database with test orders and notifications.

## ⚡ Super Quick (2 minutes)

### Using the Bash Script (Recommended)

```bash
cd /Users/macbook/Desktop/delivery-app/new-alaba-marketplace

# Make script executable (one-time)
chmod +x seed-database.sh

# Run the script
./seed-database.sh

# Follow the interactive prompts
```

### Using psql Directly

```bash
cd /Users/macbook/Desktop/delivery-app/new-alaba-marketplace

# Seed everything at once
psql -U postgres -d alaba_marketplace -f seed-all.sql

# Or just orders
psql -U postgres -d alaba_marketplace -f seed-orders.sql

# Or just notifications
psql -U postgres -d alaba_marketplace -f seed-notifications-extended.sql
```

## 📋 Available Files

| File                              | Purpose                                        | Size       |
| --------------------------------- | ---------------------------------------------- | ---------- |
| `seed-all.sql`                    | **Complete solution** - Orders + Notifications | ~400 lines |
| `seed-orders.sql`                 | Orders only (8 test orders)                    | ~250 lines |
| `seed-notifications-extended.sql` | Notifications only (20+ notifications)         | ~400 lines |
| `seed-database.sh`                | Interactive bash script                        | ~100 lines |
| `SEEDING_GUIDE.md`                | Detailed documentation                         | ~400 lines |

## 📊 What Gets Created

### Orders (8 different statuses)

```
✓ PENDING        - Order placed, awaiting payment
✓ ACCEPTED       - Ready for driver assignment
✓ IN_TRANSIT     - Driver on the way
✓ DELIVERED      - Successfully completed
✓ CANCELLED      - Buyer cancelled
✓ FAILED         - Delivery failed
+ 2 more realistic order scenarios
```

### Notifications (20+ diverse notifications)

```
✓ Order notifications - Status updates
✓ Driver notifications - Assignments & tracking
✓ Payment notifications - Confirmations & alerts
✓ System notifications - Updates & alerts
✓ Alerts - Stock warnings, delivery issues
```

## ✅ Prerequisites

Before seeding, make sure you have:

1. **Database running**: PostgreSQL is running and accessible
2. **Database created**: `alaba_marketplace` exists
3. **Tables created**: Run your migrations first
4. **At least one user of each role**: BUYER, SELLER (DRIVER is optional)
5. **At least one product**: Product exists for orders
6. **At least one delivery company**: For orders

### Quick Prerequisites Check

```sql
-- Check existing users
SELECT role, COUNT(*) FROM users GROUP BY role;

-- Check products
SELECT COUNT(*) FROM products;

-- Check delivery companies
SELECT COUNT(*) FROM "deliveryCompanies";
```

If any are missing, create them first:

```sql
INSERT INTO users (email, password, "firstName", "lastName", phone, role, address)
VALUES ('buyer@test.com', '<hashed_password>', 'Test', 'Buyer', '+2341234567890', 'BUYER', 'Lagos');

INSERT INTO users (email, password, "firstName", "lastName", phone, role, address)
VALUES ('seller@test.com', '<hashed_password>', 'Test', 'Seller', '+2349876543210', 'SELLER', 'Lagos');

INSERT INTO products (name, description, price, "sellerId")
VALUES ('Test Product', 'A test product', 5000, '<seller_id>');

INSERT INTO "deliveryCompanies" (name, email, phone, address, status)
VALUES ('TestDeliver', 'test@deliver.com', '+2341234567890', 'Lagos', 'ACTIVE');
```

## 🎯 Testing Scenarios

With seeded data, you can test:

- [ ] Order workflow (PENDING → ACCEPTED → IN_TRANSIT → DELIVERED)
- [ ] Order acceptance from marketplace
- [ ] Driver assignment
- [ ] Tracking updates
- [ ] Notification delivery
- [ ] Real-time WebSocket updates
- [ ] Network reliability with order acceptance
- [ ] Multiple concurrent operations

## 🔧 Customization

Want different data? Edit the SQL files:

```sql
-- Example: Change order quantity
quantity, "unitPrice", "totalPrice", "deliveryFee"
5, 75.00, 375.00, 15.00  -- Change as needed
```

## 📈 Verify Seeding Success

After running the seed script, check the data:

```sql
-- Count orders
SELECT status, COUNT(*) FROM orders GROUP BY status;

-- Count notifications
SELECT type, COUNT(*) FROM notifications GROUP BY type;

-- List all orders
SELECT id, status, "buyerId", "deliveryAddress" FROM orders;

-- List unread notifications
SELECT "userId", title, message FROM notifications WHERE "isRead" = false;
```

## 🆘 Troubleshooting

### "psql: command not found"

```bash
# Install PostgreSQL client tools
brew install postgresql  # macOS
sudo apt-get install postgresql-client  # Ubuntu/Debian
```

### "FATAL: database does not exist"

```bash
# Create the database first
createdb -U postgres alaba_marketplace
```

### "ERROR: relation 'users' does not exist"

```bash
# Run your migrations first
npm run migrate  # or your migration command
```

### "Permission denied" / "Access denied"

```bash
# Use correct username/password
psql -U your_username -d alaba_marketplace -f seed-all.sql

# Or set environment variables
export PGUSER=your_username
export PGPASSWORD=your_password
psql -d alaba_marketplace -f seed-all.sql
```

## 🧹 Resetting Data

To delete all seeded data:

```sql
-- Delete notifications and orders
DELETE FROM notifications WHERE "createdAt" > '2025-12-10'::date;
DELETE FROM orders WHERE "createdAt" > '2025-12-10'::date;
```

Or completely reset (⚠️ deletes everything):

```sql
DELETE FROM notifications;
DELETE FROM orders;
DELETE FROM drivers;
-- ... other tables
```

## 📚 More Information

For detailed documentation, see: `SEEDING_GUIDE.md`

Key sections:

- Complete setup instructions
- All available seeding methods
- Detailed troubleshooting
- Database schema information
- Advanced customization

## 💡 Pro Tips

1. **Use interactive script first**: `./seed-database.sh` - easier than typing commands
2. **Backup before seeding**: `pg_dump alaba_marketplace > backup.sql`
3. **Run multiple times**: Scripts are safe - can run repeatedly
4. **Customize before seeding**: Edit the SQL files to match your needs
5. **Check status after**: Verify with sample queries above

## 🎁 What You Get

After seeding:

- **8 realistic orders** with different statuses and tracking history
- **20+ notifications** across all user types
- **Complete test data** to verify all integrations
- **Ready to test** order workflow, notifications, and network reliability

## 🚀 Next Steps

```bash
# 1. Seed database
./seed-database.sh

# 2. Start your backend server
npm run start

# 3. Start your mobile app
cd ../abm-delivery-app
npm start

# 4. Test interactions with seeded data
# - Place/accept orders
# - Check notifications
# - Verify real-time updates
# - Test network reliability features
```

---

**Questions?** Check `SEEDING_GUIDE.md` for comprehensive documentation.

**Ready?** Run `./seed-database.sh` now! 🎉
