-- ========================================
-- COMPREHENSIVE DATABASE SEEDING SCRIPT
-- ========================================
-- This script seeds the database with test data for:
-- 1. Orders (8 different statuses)
-- 2. Notifications (all types)
-- 3. Test users (if needed)
--
-- Instructions:
-- 1. Connect to your PostgreSQL database
-- 2. Run this script: psql -U your_username -d your_database -f seed-all.sql
-- 3. Or copy & paste the entire script into your database admin tool

-- ========================================
-- STEP 1: Create Test Users (Optional - if you don't have any)
-- ========================================
-- Uncomment this section if you need to create test users first

/*
-- Create a test buyer
INSERT INTO users (id, email, password, "firstName", "lastName", phone, role, avatar, address, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'testbuyer@example.com',
  '$2b$10$YourHashedPasswordHere',
  'Test',
  'Buyer',
  '+2341234567890',
  'BUYER',
  NULL,
  '123 Test Street, Lagos',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Create a test seller
INSERT INTO users (id, email, password, "firstName", "lastName", phone, role, avatar, address, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'testseller@example.com',
  '$2b$10$YourHashedPasswordHere',
  'Test',
  'Seller',
  '+2349876543210',
  'SELLER',
  NULL,
  '456 Business Avenue, Lagos',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Create a test driver
INSERT INTO users (id, email, password, "firstName", "lastName", phone, role, avatar, address, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'testdriver@example.com',
  '$2b$10$YourHashedPasswordHere',
  'Test',
  'Driver',
  '+2348765432109',
  'DRIVER',
  NULL,
  '789 Transport Street, Lagos',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;
*/

-- ========================================
-- STEP 2: Verify Required Data Exists
-- ========================================
-- Check that we have the necessary base data

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE role = 'BUYER' LIMIT 1) THEN
    RAISE NOTICE 'WARNING: No BUYER users found. Please create at least one buyer user first.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM users WHERE role = 'SELLER' LIMIT 1) THEN
    RAISE NOTICE 'WARNING: No SELLER users found. Please create at least one seller user first.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM products LIMIT 1) THEN
    RAISE NOTICE 'WARNING: No products found. Please create at least one product first.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "deliveryCompanies" LIMIT 1) THEN
    RAISE NOTICE 'WARNING: No delivery companies found. Please create at least one delivery company first.';
  END IF;
END $$;

-- ========================================
-- STEP 3: SEED ORDERS
-- ========================================

DO $$
DECLARE
  buyer_id UUID;
  seller_id UUID;
  product_id UUID;
  delivery_company_id UUID;
  driver_id UUID;
  order_count INT := 0;
BEGIN
  SELECT id INTO buyer_id FROM users WHERE role = 'BUYER' LIMIT 1;
  SELECT id INTO seller_id FROM users WHERE role = 'SELLER' LIMIT 1;
  SELECT id INTO product_id FROM products LIMIT 1;
  SELECT id INTO delivery_company_id FROM "deliveryCompanies" LIMIT 1;
  SELECT id INTO driver_id FROM drivers LIMIT 1;

  IF buyer_id IS NOT NULL AND seller_id IS NOT NULL AND product_id IS NOT NULL THEN
    RAISE NOTICE '';
    RAISE NOTICE '=== SEEDING ORDERS ===';
    RAISE NOTICE 'Using Buyer: %, Seller: %, Product: %', buyer_id, seller_id, product_id;

    -- Order 1: PENDING
    INSERT INTO orders (
      id, "buyerId", "sellerId", "productId", "deliveryCompanyId", "driverId",
      quantity, "unitPrice", "totalPrice", "deliveryFee", status, "paymentStatus",
      "paystackReference", "barcodeShortCode", "deliveryCode", "selectedRoute",
      "deliveryAddress", "deliveryCity", "deliveryState", "trackingHistory",
      "deliveredAt", "assignedAt", "createdAt", "updatedAt"
    ) VALUES (
      gen_random_uuid(), buyer_id, seller_id, product_id, delivery_company_id, NULL,
      2, 50.00, 100.00, 10.00, 'PENDING', 'PENDING',
      NULL, 'BC' || SUBSTR(MD5(RANDOM()::text), 1, 6), 'DC' || SUBSTR(MD5(RANDOM()::text), 1, 8),
      'Route A', '123 Main Street, Lagos, Nigeria', 'Lagos', 'Lagos',
      '[]', NULL, NULL, NOW(), NOW()
    );
    order_count := order_count + 1;

    -- Order 2: ACCEPTED
    INSERT INTO orders (
      id, "buyerId", "sellerId", "productId", "deliveryCompanyId", "driverId",
      quantity, "unitPrice", "totalPrice", "deliveryFee", status, "paymentStatus",
      "paystackReference", "barcodeShortCode", "deliveryCode", "selectedRoute",
      "deliveryAddress", "deliveryCity", "deliveryState", "trackingHistory",
      "deliveredAt", "assignedAt", "createdAt", "updatedAt"
    ) VALUES (
      gen_random_uuid(), buyer_id, seller_id, product_id, delivery_company_id, NULL,
      1, 75.00, 75.00, 15.00, 'ACCEPTED', 'COMPLETED',
      'PSP_' || SUBSTR(MD5(RANDOM()::text), 1, 12), 'BC' || SUBSTR(MD5(RANDOM()::text), 1, 6), 'DC' || SUBSTR(MD5(RANDOM()::text), 1, 8),
      'Route B', '456 Market Street, Abuja, Nigeria', 'Abuja', 'FCT',
      '[{"status":"ACCEPTED","timestamp":"' || NOW() || '","remarks":"Order accepted by delivery company"}]',
      NULL, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'
    );
    order_count := order_count + 1;

    -- Order 3: IN_TRANSIT
    INSERT INTO orders (
      id, "buyerId", "sellerId", "productId", "deliveryCompanyId", "driverId",
      quantity, "unitPrice", "totalPrice", "deliveryFee", status, "paymentStatus",
      "paystackReference", "barcodeShortCode", "deliveryCode", "selectedRoute",
      "deliveryAddress", "deliveryCity", "deliveryState", "trackingHistory",
      "deliveredAt", "assignedAt", "createdAt", "updatedAt"
    ) VALUES (
      gen_random_uuid(), buyer_id, seller_id, product_id, delivery_company_id, driver_id,
      3, 100.00, 300.00, 20.00, 'IN_TRANSIT', 'COMPLETED',
      'PSP_' || SUBSTR(MD5(RANDOM()::text), 1, 12), 'BC' || SUBSTR(MD5(RANDOM()::text), 1, 6), 'DC' || SUBSTR(MD5(RANDOM()::text), 1, 8),
      'Route C', '789 Park Avenue, Port Harcourt, Nigeria', 'Port Harcourt', 'Rivers',
      '[
        {"status":"PENDING","timestamp":"' || (NOW() - INTERVAL '4 hours') || '","remarks":"Order placed"},
        {"status":"ACCEPTED","timestamp":"' || (NOW() - INTERVAL '3 hours') || '","remarks":"Order accepted"},
        {"status":"ASSIGNED","timestamp":"' || (NOW() - INTERVAL '2 hours') || '","remarks":"Driver assigned"},
        {"status":"IN_TRANSIT","timestamp":"' || (NOW() - INTERVAL '1 hour') || '","remarks":"Driver in transit"}
      ]',
      NULL, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'
    );
    order_count := order_count + 1;

    -- Order 4: DELIVERED
    INSERT INTO orders (
      id, "buyerId", "sellerId", "productId", "deliveryCompanyId", "driverId",
      quantity, "unitPrice", "totalPrice", "deliveryFee", status, "paymentStatus",
      "paystackReference", "barcodeShortCode", "deliveryCode", "selectedRoute",
      "deliveryAddress", "deliveryCity", "deliveryState", "trackingHistory",
      "deliveredAt", "assignedAt", "createdAt", "updatedAt"
    ) VALUES (
      gen_random_uuid(), buyer_id, seller_id, product_id, delivery_company_id, driver_id,
      1, 125.00, 125.00, 25.00, 'DELIVERED', 'COMPLETED',
      'PSP_' || SUBSTR(MD5(RANDOM()::text), 1, 12), 'BC' || SUBSTR(MD5(RANDOM()::text), 1, 6), 'DC' || SUBSTR(MD5(RANDOM()::text), 1, 8),
      'Route D', '321 Tree Road, Kano, Nigeria', 'Kano', 'Kano',
      '[
        {"status":"PENDING","timestamp":"' || (NOW() - INTERVAL '8 hours') || '","remarks":"Order placed"},
        {"status":"ACCEPTED","timestamp":"' || (NOW() - INTERVAL '7 hours') || '","remarks":"Order accepted"},
        {"status":"ASSIGNED","timestamp":"' || (NOW() - INTERVAL '6 hours') || '","remarks":"Driver assigned"},
        {"status":"IN_TRANSIT","timestamp":"' || (NOW() - INTERVAL '5 hours') || '","remarks":"Driver in transit"},
        {"status":"DELIVERED","timestamp":"' || (NOW() - INTERVAL '1 hour') || '","remarks":"Package delivered successfully"}
      ]',
      NOW() - INTERVAL '1 hour', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '8 hours', NOW() - INTERVAL '8 hours'
    );
    order_count := order_count + 1;

    -- Order 5: CANCELLED
    INSERT INTO orders (
      id, "buyerId", "sellerId", "productId", "deliveryCompanyId", "driverId",
      quantity, "unitPrice", "totalPrice", "deliveryFee", status, "paymentStatus",
      "paystackReference", "barcodeShortCode", "deliveryCode", "selectedRoute",
      "deliveryAddress", "deliveryCity", "deliveryState", "trackingHistory",
      "deliveredAt", "assignedAt", "createdAt", "updatedAt"
    ) VALUES (
      gen_random_uuid(), buyer_id, seller_id, product_id, delivery_company_id, NULL,
      2, 200.00, 400.00, 30.00, 'CANCELLED', 'PENDING',
      NULL, 'BC' || SUBSTR(MD5(RANDOM()::text), 1, 6), 'DC' || SUBSTR(MD5(RANDOM()::text), 1, 8),
      'Route E', '555 Sunset Boulevard, Ibadan, Nigeria', 'Ibadan', 'Oyo',
      '[{"status":"PENDING","timestamp":"' || (NOW() - INTERVAL '12 hours') || '","remarks":"Order placed"},{"status":"CANCELLED","timestamp":"' || (NOW() - INTERVAL '10 hours') || '","remarks":"Cancelled by buyer"}]',
      NULL, NULL, NOW() - INTERVAL '12 hours', NOW() - INTERVAL '12 hours'
    );
    order_count := order_count + 1;

    -- Order 6: FAILED
    INSERT INTO orders (
      id, "buyerId", "sellerId", "productId", "deliveryCompanyId", "driverId",
      quantity, "unitPrice", "totalPrice", "deliveryFee", status, "paymentStatus",
      "paystackReference", "barcodeShortCode", "deliveryCode", "selectedRoute",
      "deliveryAddress", "deliveryCity", "deliveryState", "trackingHistory",
      "deliveredAt", "assignedAt", "createdAt", "updatedAt"
    ) VALUES (
      gen_random_uuid(), buyer_id, seller_id, product_id, delivery_company_id, driver_id,
      1, 80.00, 80.00, 15.00, 'FAILED', 'COMPLETED',
      'PSP_' || SUBSTR(MD5(RANDOM()::text), 1, 12), 'BC' || SUBSTR(MD5(RANDOM()::text), 1, 6), 'DC' || SUBSTR(MD5(RANDOM()::text), 1, 8),
      'Route G', '888 Ocean Drive, Calabar, Nigeria', 'Calabar', 'Cross River',
      '[
        {"status":"PENDING","timestamp":"' || (NOW() - INTERVAL '5 hours') || '","remarks":"Order placed"},
        {"status":"ACCEPTED","timestamp":"' || (NOW() - INTERVAL '4 hours') || '","remarks":"Order accepted"},
        {"status":"IN_TRANSIT","timestamp":"' || (NOW() - INTERVAL '2 hours') || '","remarks":"Driver in transit"},
        {"status":"FAILED","timestamp":"' || (NOW() - INTERVAL '30 minutes') || '","remarks":"Delivery failed - Recipient not available"}
      ]',
      NULL, NOW() - INTERVAL '4 hours', NOW() - INTERVAL '5 hours', NOW() - INTERVAL '5 hours'
    );
    order_count := order_count + 1;

    RAISE NOTICE 'Successfully inserted % orders', order_count;
  ELSE
    RAISE EXCEPTION 'Cannot seed orders: Missing required data (Buyer: %, Seller: %, Product: %)', buyer_id, seller_id, product_id;
  END IF;
END $$;

-- ========================================
-- STEP 4: SEED NOTIFICATIONS
-- ========================================

DO $$
DECLARE
  buyer_id UUID;
  seller_id UUID;
  driver_user_id UUID;
  notification_count INT := 0;
BEGIN
  SELECT id INTO buyer_id FROM users WHERE role = 'BUYER' LIMIT 1;
  SELECT id INTO seller_id FROM users WHERE role = 'SELLER' LIMIT 1;
  SELECT id INTO driver_user_id FROM users WHERE role = 'DRIVER' LIMIT 1;

  RAISE NOTICE '';
  RAISE NOTICE '=== SEEDING NOTIFICATIONS ===';

  IF buyer_id IS NOT NULL THEN
    RAISE NOTICE 'Seeding buyer notifications...';
    
    INSERT INTO notifications ("userId", title, message, type, "isRead", "actionUrl", data, "createdAt", "updatedAt")
    VALUES (buyer_id, 'New Order Confirmation', 'Your order #ORD-001 has been confirmed', 'order', false, '/orders/ORD-001', 
            '{"orderId":"ORD-001","status":"PENDING"}', NOW(), NOW());
    notification_count := notification_count + 1;

    INSERT INTO notifications ("userId", title, message, type, "isRead", "actionUrl", data, "createdAt", "updatedAt")
    VALUES (buyer_id, 'Order Accepted', 'Your order #ORD-002 has been accepted by the delivery company', 'order', false, '/orders/ORD-002', 
            '{"orderId":"ORD-002","status":"ACCEPTED","companyName":"FastDeliver Ltd"}', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours');
    notification_count := notification_count + 1;

    INSERT INTO notifications ("userId", title, message, type, "isRead", "actionUrl", data, "createdAt", "updatedAt")
    VALUES (buyer_id, 'Driver Assigned', 'Driver John has been assigned to deliver your order #ORD-003', 'driver', false, '/orders/ORD-003/tracking', 
            '{"orderId":"ORD-003","driverId":"DRV-123","driverName":"John","driverPhone":"+2341234567890","driverRating":4.8}', NOW() - INTERVAL '4 hours', NOW() - INTERVAL '4 hours');
    notification_count := notification_count + 1;

    INSERT INTO notifications ("userId", title, message, type, "isRead", "actionUrl", data, "createdAt", "updatedAt")
    VALUES (buyer_id, 'Payment Confirmed', 'Payment of ₦5,000.00 for order #ORD-006 has been confirmed', 'payment', true, '/orders/ORD-006/receipt', 
            '{"orderId":"ORD-006","amount":5000,"currency":"NGN","reference":"PSP_12345678"}', NOW() - INTERVAL '12 hours', NOW() - INTERVAL '12 hours');
    notification_count := notification_count + 1;

    INSERT INTO notifications ("userId", title, message, type, "isRead", "actionUrl", data, "createdAt", "updatedAt")
    VALUES (buyer_id, 'Important Update', 'Our app has been updated with new features. Please refresh to see the changes.', 'system', false, '/app-settings', 
            '{"version":"2.1.0","features":["real-time tracking","push notifications"]}', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');
    notification_count := notification_count + 1;

  END IF;

  IF seller_id IS NOT NULL THEN
    RAISE NOTICE 'Seeding seller notifications...';

    INSERT INTO notifications ("userId", title, message, type, "isRead", "actionUrl", data, "createdAt", "updatedAt")
    VALUES (seller_id, 'New Order Received', 'A new order #ORD-101 for "Laptop" has been placed', 'order', false, '/orders/ORD-101', 
            '{"orderId":"ORD-101","productName":"Laptop","quantity":1,"buyerName":"Ahmed"}', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes');
    notification_count := notification_count + 1;

    INSERT INTO notifications ("userId", title, message, type, "isRead", "actionUrl", data, "createdAt", "updatedAt")
    VALUES (seller_id, 'Order Accepted by Delivery', 'Order #ORD-102 has been accepted by FastDeliver Ltd', 'order', false, '/orders/ORD-102', 
            '{"orderId":"ORD-102","companyName":"FastDeliver Ltd","acceptedAt":"' || NOW()::text || '"}', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour');
    notification_count := notification_count + 1;

    INSERT INTO notifications ("userId", title, message, type, "isRead", "actionUrl", data, "createdAt", "updatedAt")
    VALUES (seller_id, 'Payment Received', 'Payment of ₦12,500.00 for order #ORD-104 has been received', 'payment', true, '/payments', 
            '{"orderId":"ORD-104","amount":12500,"currency":"NGN","reference":"PSP_87654321"}', NOW() - INTERVAL '5 hours', NOW() - INTERVAL '5 hours');
    notification_count := notification_count + 1;

    INSERT INTO notifications ("userId", title, message, type, "isRead", "actionUrl", data, "createdAt", "updatedAt")
    VALUES (seller_id, 'Low Stock Alert', 'Product stock is running low', 'alert', false, '/inventory', 
            '{"productId":"PROD-001","currentStock":2,"reorderLevel":5}', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours');
    notification_count := notification_count + 1;

  END IF;

  IF driver_user_id IS NOT NULL THEN
    RAISE NOTICE 'Seeding driver notifications...';

    INSERT INTO notifications ("userId", title, message, type, "isRead", "actionUrl", data, "createdAt", "updatedAt")
    VALUES (driver_user_id, 'New Delivery Assigned', 'You have been assigned to deliver order #ORD-201 to Lagos', 'driver', false, '/deliveries/ORD-201', 
            '{"orderId":"ORD-201","pickupLocation":"Victoria Island","deliveryLocation":"Lekki","distance":"15km","estimatedTime":"45 mins"}', NOW() - INTERVAL '20 minutes', NOW() - INTERVAL '20 minutes');
    notification_count := notification_count + 1;

    INSERT INTO notifications ("userId", title, message, type, "isRead", "actionUrl", data, "createdAt", "updatedAt")
    VALUES (driver_user_id, 'Delivery Completed', 'Order #ORD-202 has been delivered successfully', 'driver', true, '/deliveries/ORD-202', 
            '{"orderId":"ORD-202","completedAt":"' || (NOW() - INTERVAL '30 minutes')::text || '","earningsAdded":2500}', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour');
    notification_count := notification_count + 1;

    INSERT INTO notifications ("userId", title, message, type, "isRead", "actionUrl", data, "createdAt", "updatedAt")
    VALUES (driver_user_id, 'Daily Earnings Summary', 'You earned ₦15,000.00 today from 10 deliveries', 'payment', true, '/earnings', 
            '{"date":"' || CURRENT_DATE::text || '","earnings":15000,"deliveries":10}', NOW() - INTERVAL '12 hours', NOW() - INTERVAL '12 hours');
    notification_count := notification_count + 1;

    INSERT INTO notifications ("userId", title, message, type, "isRead", "actionUrl", data, "createdAt", "updatedAt")
    VALUES (driver_user_id, 'Profile Update Required', 'Please update your vehicle information', 'system', false, '/profile/vehicle', 
            '{"requiredFields":["vehicleRegistration","vehicleColor"]}', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');
    notification_count := notification_count + 1;

  END IF;

  RAISE NOTICE 'Successfully inserted % notifications', notification_count;

END $$;

-- ========================================
-- STEP 5: Display Summary Statistics
-- ========================================

RAISE NOTICE '';
RAISE NOTICE '====================================';
RAISE NOTICE '===  DATABASE SEED COMPLETE      ===';
RAISE NOTICE '====================================';

SELECT 
  'ORDERS' as "Category",
  COUNT(*)::TEXT as "Count",
  '' as "Details"
FROM orders
UNION ALL
SELECT 
  'Order Status: PENDING',
  COUNT(*)::TEXT,
  ''
FROM orders WHERE status = 'PENDING'
UNION ALL
SELECT 
  'Order Status: ACCEPTED',
  COUNT(*)::TEXT,
  ''
FROM orders WHERE status = 'ACCEPTED'
UNION ALL
SELECT 
  'Order Status: IN_TRANSIT',
  COUNT(*)::TEXT,
  ''
FROM orders WHERE status = 'IN_TRANSIT'
UNION ALL
SELECT 
  'Order Status: DELIVERED',
  COUNT(*)::TEXT,
  ''
FROM orders WHERE status = 'DELIVERED'
UNION ALL
SELECT 
  'NOTIFICATIONS',
  COUNT(*)::TEXT,
  ''
FROM notifications
UNION ALL
SELECT 
  'Unread Notifications',
  COUNT(*)::TEXT,
  ''
FROM notifications WHERE "isRead" = false
UNION ALL
SELECT 
  'Notification Type: Order',
  COUNT(*)::TEXT,
  ''
FROM notifications WHERE type = 'order'
UNION ALL
SELECT 
  'Notification Type: Driver',
  COUNT(*)::TEXT,
  ''
FROM notifications WHERE type = 'driver'
UNION ALL
SELECT 
  'Notification Type: Payment',
  COUNT(*)::TEXT,
  ''
FROM notifications WHERE type = 'payment';

RAISE NOTICE '';
RAISE NOTICE 'You can now use this data to test all interactions!';
RAISE NOTICE '';
