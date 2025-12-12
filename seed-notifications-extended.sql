-- ========================================
-- SEED DATA: Notifications
-- ========================================
-- This script creates sample notifications for testing
-- Covers all notification types: order, driver, system, payment, invitation, alert

DO $$
DECLARE
  buyer_id UUID;
  seller_id UUID;
  driver_user_id UUID;
  notification_count INT := 0;
BEGIN
  -- Get sample users with different roles
  SELECT id INTO buyer_id FROM users WHERE role = 'BUYER' LIMIT 1;
  SELECT id INTO seller_id FROM users WHERE role = 'SELLER' LIMIT 1;
  SELECT id INTO driver_user_id FROM users WHERE role = 'DRIVER' LIMIT 1;

  IF buyer_id IS NOT NULL THEN
    -- ============================================
    -- NOTIFICATIONS FOR BUYER
    -- ============================================

    -- Order Notifications
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
    VALUES (buyer_id, 'Order on the Way', 'Your order #ORD-004 is on the way. Estimated delivery: 2 hours', 'driver', false, '/orders/ORD-004/tracking', 
            '{"orderId":"ORD-004","status":"IN_TRANSIT","driverLocation":"Lekki","estimatedTime":"14:30"}', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours');
    notification_count := notification_count + 1;

    INSERT INTO notifications ("userId", title, message, type, "isRead", "actionUrl", data, "createdAt", "updatedAt")
    VALUES (buyer_id, 'Delivery Completed', 'Your order #ORD-005 has been delivered successfully!', 'order', true, '/orders/ORD-005', 
            '{"orderId":"ORD-005","status":"DELIVERED","deliveredAt":"' || (NOW() - INTERVAL '1 hour')::text || '"}', NOW() - INTERVAL '8 hours', NOW() - INTERVAL '8 hours');
    notification_count := notification_count + 1;

    -- Payment Notifications
    INSERT INTO notifications ("userId", title, message, type, "isRead", "actionUrl", data, "createdAt", "updatedAt")
    VALUES (buyer_id, 'Payment Confirmed', 'Payment of ₦5,000.00 for order #ORD-006 has been confirmed', 'payment', true, '/orders/ORD-006/receipt', 
            '{"orderId":"ORD-006","amount":5000,"currency":"NGN","reference":"PSP_12345678"}', NOW() - INTERVAL '12 hours', NOW() - INTERVAL '12 hours');
    notification_count := notification_count + 1;

    INSERT INTO notifications ("userId", title, message, type, "isRead", "actionUrl", data, "createdAt", "updatedAt")
    VALUES (buyer_id, 'Payment Failed', 'Payment for order #ORD-007 could not be processed. Please try again', 'payment', false, '/orders/ORD-007/payment', 
            '{"orderId":"ORD-007","amount":3500,"currency":"NGN","error":"insufficient_funds"}', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 hours');
    notification_count := notification_count + 1;

    -- System Notifications
    INSERT INTO notifications ("userId", title, message, type, "isRead", "actionUrl", data, "createdAt", "updatedAt")
    VALUES (buyer_id, 'Important Update', 'Our app has been updated with new features. Please refresh to see the changes.', 'system', false, '/app-settings', 
            '{"version":"2.1.0","features":["real-time tracking","push notifications"]}', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');
    notification_count := notification_count + 1;

    -- Alert Notifications
    INSERT INTO notifications ("userId", title, message, type, "isRead", "actionUrl", data, "createdAt", "updatedAt")
    VALUES (buyer_id, 'Order Cancelled', 'Your order #ORD-008 has been cancelled due to seller unavailability', 'alert', true, '/orders/history', 
            '{"orderId":"ORD-008","reason":"seller_unavailable","refundStatus":"processing"}', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days');
    notification_count := notification_count + 1;

  END IF;

  IF seller_id IS NOT NULL THEN
    -- ============================================
    -- NOTIFICATIONS FOR SELLER
    -- ============================================

    -- New Order Notifications
    INSERT INTO notifications ("userId", title, message, type, "isRead", "actionUrl", data, "createdAt", "updatedAt")
    VALUES (seller_id, 'New Order Received', 'A new order #ORD-101 for "Laptop" has been placed', 'order', false, '/orders/ORD-101', 
            '{"orderId":"ORD-101","productName":"Laptop","quantity":1,"buyerName":"Ahmed"}', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes');
    notification_count := notification_count + 1;

    INSERT INTO notifications ("userId", title, message, type, "isRead", "actionUrl", data, "createdAt", "updatedAt")
    VALUES (seller_id, 'Order Accepted by Delivery', 'Order #ORD-102 has been accepted by FastDeliver Ltd', 'order', false, '/orders/ORD-102', 
            '{"orderId":"ORD-102","companyName":"FastDeliver Ltd","acceptedAt":"' || NOW()::text || '"}', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour');
    notification_count := notification_count + 1;

    INSERT INTO notifications ("userId", title, message, type, "isRead", "actionUrl", data, "createdAt", "updatedAt")
    VALUES (seller_id, 'Order Delivered', 'Order #ORD-103 has been successfully delivered to the buyer', 'order', true, '/orders/ORD-103', 
            '{"orderId":"ORD-103","deliveredAt":"' || (NOW() - INTERVAL '2 hours')::text || '"}', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 hours');
    notification_count := notification_count + 1;

    -- Payment Notifications
    INSERT INTO notifications ("userId", title, message, type, "isRead", "actionUrl", data, "createdAt", "updatedAt")
    VALUES (seller_id, 'Payment Received', 'Payment of ₦12,500.00 for order #ORD-104 has been received', 'payment', true, '/payments', 
            '{"orderId":"ORD-104","amount":12500,"currency":"NGN","reference":"PSP_87654321","date":"' || (NOW() - INTERVAL '4 hours')::text || '"}', NOW() - INTERVAL '5 hours', NOW() - INTERVAL '5 hours');
    notification_count := notification_count + 1;

    -- Alert Notifications
    INSERT INTO notifications ("userId", title, message, type, "isRead", "actionUrl", data, "createdAt", "updatedAt")
    VALUES (seller_id, 'Low Stock Alert', 'Product "Laptop" stock is running low (2 units remaining)', 'alert', false, '/inventory', 
            '{"productId":"PROD-001","productName":"Laptop","currentStock":2,"reorderLevel":5}', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours');
    notification_count := notification_count + 1;

    INSERT INTO notifications ("userId", title, message, type, "isRead", "actionUrl", data, "createdAt", "updatedAt")
    VALUES (seller_id, 'Order Cancelled', 'Order #ORD-105 has been cancelled by the buyer', 'alert', true, '/orders/history', 
            '{"orderId":"ORD-105","buyerName":"Zainab","reason":"changed_mind"}', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');
    notification_count := notification_count + 1;

  END IF;

  IF driver_user_id IS NOT NULL THEN
    -- ============================================
    -- NOTIFICATIONS FOR DRIVER
    -- ============================================

    -- Driver Assignment Notifications
    INSERT INTO notifications ("userId", title, message, type, "isRead", "actionUrl", data, "createdAt", "updatedAt")
    VALUES (driver_user_id, 'New Delivery Assigned', 'You have been assigned to deliver order #ORD-201 to Lagos', 'driver', false, '/deliveries/ORD-201', 
            '{"orderId":"ORD-201","pickupLocation":"Victoria Island","deliveryLocation":"Lekki","distance":"15km","estimatedTime":"45 mins"}', NOW() - INTERVAL '20 minutes', NOW() - INTERVAL '20 minutes');
    notification_count := notification_count + 1;

    INSERT INTO notifications ("userId", title, message, type, "isRead", "actionUrl", data, "createdAt", "updatedAt")
    VALUES (driver_user_id, 'Delivery Completed', 'Order #ORD-202 has been delivered successfully', 'driver', true, '/deliveries/ORD-202', 
            '{"orderId":"ORD-202","completedAt":"' || (NOW() - INTERVAL '30 minutes')::text || '","earningsAdded":2500}', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour');
    notification_count := notification_count + 1;

    INSERT INTO notifications ("userId", title, message, type, "isRead", "actionUrl", data, "createdAt", "updatedAt")
    VALUES (driver_user_id, 'Delivery Reminder', 'Reminder: You have 3 pending deliveries today', 'driver', false, '/deliveries', 
            '{"pendingCount":3,"totalEarnings":7500}', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours');
    notification_count := notification_count + 1;

    -- Payment/Earnings Notifications
    INSERT INTO notifications ("userId", title, message, type, "isRead", "actionUrl", data, "createdAt", "updatedAt")
    VALUES (driver_user_id, 'Daily Earnings Summary', 'You earned ₦15,000.00 today from 10 deliveries', 'payment', true, '/earnings', 
            '{"date":"' || CURRENT_DATE::text || '","earnings":15000,"deliveries":10}', NOW() - INTERVAL '12 hours', NOW() - INTERVAL '12 hours');
    notification_count := notification_count + 1;

    INSERT INTO notifications ("userId", title, message, type, "isRead", "actionUrl", data, "createdAt", "updatedAt")
    VALUES (driver_user_id, 'Weekly Bonus Earned', 'Congratulations! You earned ₦5,000 bonus for 50+ deliveries this week', 'payment', false, '/earnings', 
            '{"bonusType":"weekly","amount":5000,"reason":"50_deliveries","weekEnding":"' || (CURRENT_DATE + INTERVAL '6 days')::text || '"}', NOW() - INTERVAL '18 hours', NOW() - INTERVAL '18 hours');
    notification_count := notification_count + 1;

    -- System Notifications
    INSERT INTO notifications ("userId", title, message, type, "isRead", "actionUrl", data, "createdAt", "updatedAt")
    VALUES (driver_user_id, 'Profile Update Required', 'Please update your vehicle information for safety verification', 'system', false, '/profile/vehicle', 
            '{"requiredFields":["vehicleRegistration","vehicleColor","vehiclePlate"]}', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');
    notification_count := notification_count + 1;

    -- Alert Notifications
    INSERT INTO notifications ("userId", title, message, type, "isRead", "actionUrl", data, "createdAt", "updatedAt")
    VALUES (driver_user_id, 'Rating Alert', 'Your rating has dropped to 4.2 stars. Improve your performance', 'alert', false, '/ratings', 
            '{"currentRating":4.2,"previousRating":4.5,"recentReview":"Driver was rude"}', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 hours');
    notification_count := notification_count + 1;

  END IF;

  -- ============================================
  -- GENERAL SYSTEM NOTIFICATIONS
  -- ============================================
  -- These can be for any user
  IF buyer_id IS NOT NULL THEN
    INSERT INTO notifications ("userId", title, message, type, "isRead", "actionUrl", data, "createdAt", "updatedAt")
    VALUES (buyer_id, 'Referral Bonus', 'Your friend signed up! You earned ₦1,000 referral bonus', 'alert', true, '/referrals', 
            '{"friendName":"Adeola","bonusAmount":1000,"referralCode":"REF_ABC123"}', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days');
    notification_count := notification_count + 1;

    INSERT INTO notifications ("userId", title, message, type, "isRead", "actionUrl", data, "createdAt", "updatedAt")
    VALUES (buyer_id, 'Birthday Special', 'Happy Birthday! Get 20% off your next order with code BIRTHDAY20', 'alert', false, '/promotions', 
            '{"promoCode":"BIRTHDAY20","discount":20,"validDays":7}', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days');
    notification_count := notification_count + 1;

    INSERT INTO notifications ("userId", title, message, type, "isRead", "actionUrl", data, "createdAt", "updatedAt")
    VALUES (buyer_id, 'Account Security', 'Your password was changed successfully on December 10, 2025', 'system', true, '/account/security', 
            '{"eventType":"password_changed","timestamp":"' || (NOW() - INTERVAL '1 day')::text || '"}', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');
    notification_count := notification_count + 1;
  END IF;

  RAISE NOTICE 'Successfully inserted % sample notifications', notification_count;
  RAISE NOTICE 'Notifications added for Buyer ID: %, Seller ID: %, Driver ID: %', buyer_id, seller_id, driver_user_id;

END $$;

-- Verify insertion
RAISE NOTICE '';
RAISE NOTICE '=== NOTIFICATION STATISTICS ===';

SELECT 
  'Total Notifications' as metric,
  COUNT(*) as value
FROM notifications
UNION ALL
SELECT 
  'Unread Notifications' as metric,
  COUNT(*) as value
FROM notifications
WHERE "isRead" = false
UNION ALL
SELECT 
  'By Type: Order' as metric,
  COUNT(*) as value
FROM notifications
WHERE type = 'order'
UNION ALL
SELECT 
  'By Type: Driver' as metric,
  COUNT(*) as value
FROM notifications
WHERE type = 'driver'
UNION ALL
SELECT 
  'By Type: Payment' as metric,
  COUNT(*) as value
FROM notifications
WHERE type = 'payment'
UNION ALL
SELECT 
  'By Type: System' as metric,
  COUNT(*) as value
FROM notifications
WHERE type = 'system'
UNION ALL
SELECT 
  'By Type: Alert' as metric,
  COUNT(*) as value
FROM notifications
WHERE type = 'alert'
UNION ALL
SELECT 
  'By Type: Invitation' as metric,
  COUNT(*) as value
FROM notifications
WHERE type = 'invitation';

-- Sample query: Get unread order notifications
SELECT 
  u.email,
  n.title,
  n.message,
  n.type,
  n."createdAt"
FROM notifications n
JOIN users u ON n."userId" = u.id
WHERE n.type = 'order' AND n."isRead" = false
ORDER BY n."createdAt" DESC;
