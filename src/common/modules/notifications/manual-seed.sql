-- Manual SQL script to seed test notifications
-- Replace 'YOUR_USER_ID_HERE' with the actual userId from the users table

-- First, get your user ID by running:
-- SELECT id, email, role FROM users WHERE email = 'company@mail.com' OR email = 'driver@mail.com';

-- Then insert test notifications (replace the userId values)
INSERT INTO notifications (id, "userId", title, message, type, "isRead", "actionUrl", data, "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'YOUR_USER_ID_HERE', '🎉 New Order Assigned', 'Order #ORD-12345 has been assigned to your company. Please assign a driver.', 'order', false, '/orders/12345', '{"orderId": "12345", "orderNumber": "ORD-12345", "type": "order_assigned"}', NOW(), NOW()),
  (gen_random_uuid(), 'YOUR_USER_ID_HERE', '✅ Driver Accepted Invitation', 'John Doe has accepted your invitation and joined your team.', 'driver', false, '/drivers', '{"driverName": "John Doe", "type": "driver_joined"}', NOW(), NOW()),
  (gen_random_uuid(), 'YOUR_USER_ID_HERE', '📦 Package Picked Up', 'Order #ORD-12346 has been picked up by driver Michael Smith.', 'order', false, '/orders/12346', '{"orderId": "12346", "orderNumber": "ORD-12346", "driverName": "Michael Smith", "type": "package_picked_up"}', NOW(), NOW()),
  (gen_random_uuid(), 'YOUR_USER_ID_HERE', '🚨 Driver Unavailable', 'Driver Sarah Johnson has marked themselves as unavailable.', 'alert', false, '/drivers', '{"driverName": "Sarah Johnson", "type": "driver_unavailable"}', NOW(), NOW()),
  (gen_random_uuid(), 'YOUR_USER_ID_HERE', '💰 Payment Received', 'Payment of ₦15,000 has been received for order #ORD-12347.', 'payment', true, '/orders/12347', '{"orderId": "12347", "orderNumber": "ORD-12347", "amount": 15000, "type": "payment_received"}', NOW(), NOW()),
  (gen_random_uuid(), 'YOUR_USER_ID_HERE', '📬 New Marketplace Order Available', 'A new order is available in the marketplace. Accept it before someone else does!', 'order', false, '/marketplace', '{"type": "marketplace_order_available"}', NOW(), NOW()),
  (gen_random_uuid(), 'YOUR_USER_ID_HERE', '⚠️ Subscription Expiring Soon', 'Your subscription will expire in 7 days. Renew now to avoid service interruption.', 'system', false, '/settings/subscription', '{"daysLeft": 7, "type": "subscription_expiring"}', NOW(), NOW()),
  (gen_random_uuid(), 'YOUR_USER_ID_HERE', '🎯 Daily Goal Achieved', 'Congratulations! You have completed 20 deliveries today.', 'system', true, '/reports', '{"deliveryCount": 20, "type": "goal_achieved"}', NOW(), NOW()),
  (gen_random_uuid(), 'YOUR_USER_ID_HERE', '🚗 Driver Performance Alert', 'Driver Alex Brown has maintained a 5-star rating for 50+ deliveries!', 'driver', false, '/drivers', '{"driverName": "Alex Brown", "rating": 5.0, "deliveryCount": 50, "type": "driver_performance"}', NOW(), NOW()),
  (gen_random_uuid(), 'YOUR_USER_ID_HERE', '📊 Weekly Report Ready', 'Your weekly performance report is now available. Check your stats!', 'system', false, '/reports', '{"reportType": "weekly", "type": "report_ready"}', NOW(), NOW());

-- Verify inserted notifications
SELECT id, title, "isRead", "createdAt" FROM notifications WHERE "userId" = 'YOUR_USER_ID_HERE' ORDER BY "createdAt" DESC;

-- Check unread count
SELECT COUNT(*) as unread_count FROM notifications WHERE "userId" = 'YOUR_USER_ID_HERE' AND "isRead" = false;
