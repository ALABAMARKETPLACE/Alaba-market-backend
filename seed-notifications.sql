-- Insert sample notifications for testing
-- Replace 'YOUR_USER_ID_HERE' with actual user IDs from your users table

-- First, let's get a user ID to use
DO $$
DECLARE
  test_user_id UUID;
BEGIN
  -- Get first user ID from users table
  SELECT id INTO test_user_id FROM users LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    -- Insert sample notifications
    INSERT INTO notifications ("userId", title, message, type, "isRead", "actionUrl", data, "createdAt", "updatedAt")
    VALUES
      (test_user_id, 'New Order Received', 'You have received a new order #ORD-001', 'order', false, '/orders/1', '{"orderId": "1"}', NOW(), NOW()),
      (test_user_id, 'Payment Confirmed', 'Payment of $250 has been confirmed', 'payment', false, '/orders/2', '{"orderId": "2", "amount": 250}', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour'),
      (test_user_id, 'Driver Assigned', 'Driver John has been assigned to your order', 'driver', true, '/orders/3', '{"orderId": "3", "driverId": "driver-123"}', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),
      (test_user_id, 'Delivery Completed', 'Your order has been delivered successfully', 'order', true, '/orders/4', '{"orderId": "4"}', NOW() - INTERVAL '5 hours', NOW() - INTERVAL '5 hours'),
      (test_user_id, 'System Update', 'We have updated our terms and conditions', 'system', false, '/terms', '{}', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
      (test_user_id, 'Driver Invitation', 'You have been invited to join ABC Logistics', 'invitation', false, '/invitations/inv-001', '{"invitationId": "inv-001", "companyName": "ABC Logistics"}', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days');
    
    RAISE NOTICE 'Sample notifications created for user: %', test_user_id;
  ELSE
    RAISE NOTICE 'No users found in database';
  END IF;
END $$;
