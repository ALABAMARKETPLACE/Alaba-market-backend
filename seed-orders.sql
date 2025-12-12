-- ========================================
-- SEED DATA: Orders
-- ========================================
-- This script creates sample orders with various statuses for testing
-- It automatically uses existing users, products, and delivery companies

DO $$
DECLARE
  buyer_id UUID;
  seller_id UUID;
  product_id UUID;
  delivery_company_id UUID;
  driver_id UUID;
  order_count INT := 0;
BEGIN
  -- Get sample users (buyer, seller)
  SELECT id INTO buyer_id FROM users WHERE role = 'BUYER' LIMIT 1;
  SELECT id INTO seller_id FROM users WHERE role = 'SELLER' LIMIT 1;
  
  -- Get sample product
  SELECT id INTO product_id FROM products LIMIT 1;
  
  -- Get sample delivery company
  SELECT id INTO delivery_company_id FROM "deliveryCompanies" LIMIT 1;
  
  -- Get sample driver
  SELECT id INTO driver_id FROM drivers LIMIT 1;

  IF buyer_id IS NOT NULL AND seller_id IS NOT NULL AND product_id IS NOT NULL THEN
    
    -- Order 1: Pending order (just placed)
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

    -- Order 2: Accepted order (waiting for driver)
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

    -- Order 3: In Transit (driver assigned)
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
        {"status":"ACCEPTED","timestamp":"' || (NOW() - INTERVAL '3 hours') || '","remarks":"Order accepted by delivery company"},
        {"status":"ASSIGNED","timestamp":"' || (NOW() - INTERVAL '2 hours') || '","remarks":"Driver assigned"},
        {"status":"IN_TRANSIT","timestamp":"' || (NOW() - INTERVAL '1 hour') || '","remarks":"Driver picked up package, in transit"}
      ]',
      NULL, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'
    );
    order_count := order_count + 1;

    -- Order 4: Delivered
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

    -- Order 5: Cancelled
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

    -- Order 6: Payment Pending (Accepted but payment not completed)
    INSERT INTO orders (
      id, "buyerId", "sellerId", "productId", "deliveryCompanyId", "driverId",
      quantity, "unitPrice", "totalPrice", "deliveryFee", status, "paymentStatus",
      "paystackReference", "barcodeShortCode", "deliveryCode", "selectedRoute",
      "deliveryAddress", "deliveryCity", "deliveryState", "trackingHistory",
      "deliveredAt", "assignedAt", "createdAt", "updatedAt"
    ) VALUES (
      gen_random_uuid(), buyer_id, seller_id, product_id, delivery_company_id, NULL,
      1, 150.00, 150.00, 20.00, 'PENDING', 'PENDING',
      NULL, 'BC' || SUBSTR(MD5(RANDOM()::text), 1, 6), 'DC' || SUBSTR(MD5(RANDOM()::text), 1, 8),
      'Route F', '777 Commerce Street, Enugu, Nigeria', 'Enugu', 'Enugu',
      '[]',
      NULL, NULL, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 hours'
    );
    order_count := order_count + 1;

    -- Order 7: Failed Delivery
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

    -- Order 8: Ready for Pickup (recently accepted)
    INSERT INTO orders (
      id, "buyerId", "sellerId", "productId", "deliveryCompanyId", "driverId",
      quantity, "unitPrice", "totalPrice", "deliveryFee", status, "paymentStatus",
      "paystackReference", "barcodeShortCode", "deliveryCode", "selectedRoute",
      "deliveryAddress", "deliveryCity", "deliveryState", "trackingHistory",
      "deliveredAt", "assignedAt", "createdAt", "updatedAt"
    ) VALUES (
      gen_random_uuid(), buyer_id, seller_id, product_id, delivery_company_id, NULL,
      4, 45.00, 180.00, 18.00, 'ACCEPTED', 'COMPLETED',
      'PSP_' || SUBSTR(MD5(RANDOM()::text), 1, 12), 'BC' || SUBSTR(MD5(RANDOM()::text), 1, 6), 'DC' || SUBSTR(MD5(RANDOM()::text), 1, 8),
      'Route H', '999 River Bank, Warri, Nigeria', 'Warri', 'Delta',
      '[{"status":"PENDING","timestamp":"' || (NOW() - INTERVAL '30 minutes') || '","remarks":"Order placed"},{"status":"ACCEPTED","timestamp":"' || NOW() || '","remarks":"Order accepted, ready for driver pickup"}]',
      NULL, NOW(), NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes'
    );
    order_count := order_count + 1;

    RAISE NOTICE 'Successfully inserted % sample orders', order_count;
  ELSE
    RAISE NOTICE 'Error: Could not find required users or products. Please ensure you have at least one buyer, seller, and product in the database.';
    RAISE NOTICE 'Buyer ID: %, Seller ID: %, Product ID: %', buyer_id, seller_id, product_id;
  END IF;
END $$;

-- Verify insertion
SELECT COUNT(*) as total_orders FROM orders;
SELECT status, COUNT(*) as count FROM orders GROUP BY status;
