-- Local transaction-focused dummy data for PostgreSQL
-- Use this after base seed data is present.
-- Depends on existing IDs from seeders/data.json:
--   STORE.id = 123456
--   USER._id = 654321
--   PRODUCTS._id in (111111, 111112, 111113)

BEGIN;

-- Clean only this demo dataset (safe to re-run)
DELETE FROM "ORDER_STATUS" WHERE "orderId" IN (990001, 990002, 990003);
DELETE FROM "ORDER_ITEMS" WHERE "orderId" IN (990001, 990002, 990003);
DELETE FROM "ORDER_PAYMENTS" WHERE "orderId" IN (990001, 990002, 990003);
DELETE FROM "ORDER" WHERE "id" IN (990001, 990002, 990003);
DELETE FROM "GUEST_CHECKOUT"
WHERE "reference" IN (
  'guest_demo_20260407_a1',
  'guest_demo_20260407_b1'
);

-- ORDER (1 regular + 2 guest)
INSERT INTO "ORDER" (
  "id",
  "userId",
  "is_multi_seller",
  "addressId",
  "storeId",
  "order_id",
  "totalItems",
  "paymentType",
  "tax",
  "deliveryCharge",
  "discount",
  "total",
  "status",
  "grandTotal",
  "delivery_date",
  "address",
  "products",
  "is_guest_order",
  "guest_email",
  "guest_first_name",
  "guest_last_name",
  "guest_phone",
  "guest_country_code",
  "delivery_full_name",
  "delivery_phone",
  "delivery_address",
  "delivery_city",
  "delivery_state",
  "delivery_state_id",
  "delivery_country",
  "delivery_country_id",
  "delivery_landmark",
  "delivery_address_type",
  "payment_reference",
  "transaction_reference",
  "order_notes",
  "preferred_delivery_time",
  "order_source",
  "device_id",
  "createdAt",
  "updatedAt"
)
VALUES
(
  990001,
  654321,
  FALSE,
  NULL,
  123456,
  800000001,
  2,
  'pay-online',
  2.00,
  5.00,
  0.00,
  244.00,
  'processing',
  251.00,
  NOW() + INTERVAL '2 days',
  '{"full_name":"Admin User","phone":"1234554321","city":"Lagos","country":"Nigeria"}'::json,
  '[{"productId":111111,"quantity":1},{"productId":111112,"quantity":1}]'::json,
  FALSE,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  'Admin User',
  '1234554321',
  '12 Example Street, Ojo, Lagos',
  'Ojo',
  'Lagos',
  39,
  'Nigeria',
  0,
  'Near market gate',
  'Home',
  'pay_ref_regular_800000001',
  'txn_regular_800000001',
  'Please call before delivery',
  '10:00-14:00',
  'web',
  'device_regular_001',
  NOW(),
  NOW()
),
(
  990002,
  NULL,
  FALSE,
  NULL,
  123456,
  800000002,
  1,
  'pay-online',
  0.00,
  3.00,
  0.00,
  145.00,
  'pending',
  148.00,
  NOW() + INTERVAL '1 day',
  NULL,
  NULL,
  TRUE,
  'guest1@example.com',
  'Guest',
  'One',
  '08000000001',
  '+234',
  'Guest One',
  '08000000001',
  '25 Trade Fair Road, Ojo, Lagos',
  'Ojo',
  'Lagos',
  39,
  'Nigeria',
  0,
  '',
  'Home',
  'pay_ref_guest_800000002',
  'txn_guest_800000002',
  'Guest checkout order',
  '',
  'web',
  'device_guest_001',
  NOW(),
  NOW()
),
(
  990003,
  NULL,
  FALSE,
  NULL,
  123456,
  800000003,
  1,
  'pay-online',
  0.00,
  2.00,
  0.00,
  99.00,
  'delivered',
  101.00,
  NOW() - INTERVAL '1 hour',
  NULL,
  NULL,
  TRUE,
  'guest2@example.com',
  'Guest',
  'Two',
  '08000000002',
  '+234',
  'Guest Two',
  '08000000002',
  '12 Alaba Intl Market, Ojo, Lagos',
  'Ojo',
  'Lagos',
  39,
  'Nigeria',
  0,
  'Opposite Plaza',
  'Office',
  'pay_ref_guest_800000003',
  'txn_guest_800000003',
  'Already delivered sample',
  '16:00-18:00',
  'mobile-app',
  'device_guest_002',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '1 hour'
)
ON CONFLICT DO NOTHING;

-- ORDER_ITEMS
INSERT INTO "ORDER_ITEMS" (
  "id",
  "orderId",
  "productId",
  "variantId",
  "quantity",
  "price",
  "totalPrice",
  "image",
  "name",
  "sku",
  "barcode",
  "combination",
  "createdAt",
  "updatedAt"
)
VALUES
(
  9901001,
  990001,
  111111,
  NULL,
  1,
  145.00,
  145.00,
  'https://example.com/products/111111.jpg',
  'V-MODA - BassFit Wireless',
  'SKU-111111',
  'BAR-111111',
  NULL,
  NOW(),
  NOW()
),
(
  9901002,
  990001,
  111112,
  NULL,
  1,
  99.00,
  99.00,
  'https://example.com/products/111112.jpg',
  'DITA Audio - Project S',
  'SKU-111112',
  'BAR-111112',
  NULL,
  NOW(),
  NOW()
),
(
  9901003,
  990002,
  111111,
  NULL,
  1,
  145.00,
  145.00,
  'https://example.com/products/111111.jpg',
  'V-MODA - BassFit Wireless',
  'SKU-111111',
  'BAR-111111',
  NULL,
  NOW(),
  NOW()
),
(
  9901004,
  990003,
  111112,
  NULL,
  1,
  99.00,
  99.00,
  'https://example.com/products/111112.jpg',
  'DITA Audio - Project S',
  'SKU-111112',
  'BAR-111112',
  NULL,
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '1 hour'
)
ON CONFLICT DO NOTHING;

-- ORDER_PAYMENTS
INSERT INTO "ORDER_PAYMENTS" (
  "id",
  "orderId",
  "paymentType",
  "status",
  "currency",
  "ref",
  "amount",
  "cardHolder",
  "createdAt",
  "updatedAt"
)
VALUES
(
  9902001,
  990001,
  'paystack',
  'success',
  'NGN',
  'pay_ref_regular_800000001',
  251.00,
  'Admin User',
  NOW(),
  NOW()
),
(
  9902002,
  990002,
  'paystack',
  'pending',
  'NGN',
  'pay_ref_guest_800000002',
  148.00,
  'Guest One',
  NOW(),
  NOW()
),
(
  9902003,
  990003,
  'paystack',
  'success',
  'NGN',
  'pay_ref_guest_800000003',
  101.00,
  'Guest Two',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '1 hour'
)
ON CONFLICT DO NOTHING;

-- ORDER_STATUS history
INSERT INTO "ORDER_STATUS" (
  "id",
  "orderId",
  "status",
  "remark",
  "createdAt",
  "updatedAt"
)
VALUES
(9903001, 990001, 'pending', 'Order created', NOW() - INTERVAL '4 hours', NOW() - INTERVAL '4 hours'),
(9903002, 990001, 'processing', 'Order is being processed', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),
(9903003, 990002, 'pending', 'Guest order created', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour'),
(9903004, 990003, 'pending', 'Guest order created', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
(9903005, 990003, 'delivered', 'Delivered successfully', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour')
ON CONFLICT DO NOTHING;

-- GUEST_CHECKOUT samples
INSERT INTO "GUEST_CHECKOUT" (
  "id",
  "reference",
  "guest_email",
  "amount_kobo",
  "payload",
  "status",
  "payment_status",
  "order_ids",
  "webhook_payload",
  "error",
  "processed_at",
  "createdAt",
  "updatedAt"
)
VALUES
(
  9904001,
  'guest_demo_20260407_a1',
  'guest1@example.com',
  14800,
  '{"guest_info":{"email":"guest1@example.com","first_name":"Guest","last_name":"One","phone":"08000000001","country_code":"+234"},"order_summary":{"subtotal":145,"tax":0,"delivery_fee":3,"discount":0,"total":148},"cart_items":[{"product_id":111111,"product_name":"V-MODA - BassFit Wireless","quantity":1,"unit_price":145,"total_price":145,"store_id":123456}],"delivery_address":{"full_name":"Guest One","phone_no":"08000000001","full_address":"25 Trade Fair Road, Ojo, Lagos","city":"Ojo","state":"Lagos","state_id":39,"country":"Nigeria","country_id":0,"country_code":"+234","address_type":"Home"},"payment":{"payment_reference":"pay_ref_guest_800000002","transaction_reference":"txn_guest_800000002","payment_method":"paystack","payment_status":"pending"}}'::jsonb,
  'ready_for_webhook',
  'pending',
  '[990002]'::jsonb,
  NULL,
  NULL,
  NULL,
  NOW(),
  NOW()
),
(
  9904002,
  'guest_demo_20260407_b1',
  'guest2@example.com',
  10100,
  '{"guest_info":{"email":"guest2@example.com","first_name":"Guest","last_name":"Two","phone":"08000000002","country_code":"+234"},"order_summary":{"subtotal":99,"tax":0,"delivery_fee":2,"discount":0,"total":101},"cart_items":[{"product_id":111112,"product_name":"DITA Audio - Project S","quantity":1,"unit_price":99,"total_price":99,"store_id":123456}],"delivery_address":{"full_name":"Guest Two","phone_no":"08000000002","full_address":"12 Alaba Intl Market, Ojo, Lagos","city":"Ojo","state":"Lagos","state_id":39,"country":"Nigeria","country_id":0,"country_code":"+234","address_type":"Office"},"payment":{"payment_reference":"pay_ref_guest_800000003","transaction_reference":"txn_guest_800000003","payment_method":"paystack","payment_status":"success"}}'::jsonb,
  'completed',
  'success',
  '[990003]'::jsonb,
  '{"event":"charge.success","reference":"guest_demo_20260407_b1"}'::jsonb,
  NULL,
  NOW() - INTERVAL '1 hour',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '1 hour'
)
ON CONFLICT DO NOTHING;

-- Keep sequences aligned with explicit IDs
SELECT setval(pg_get_serial_sequence('"ORDER"', 'id'), GREATEST((SELECT COALESCE(MAX("id"), 1) FROM "ORDER"), 1), true);
SELECT setval(pg_get_serial_sequence('"ORDER_ITEMS"', 'id'), GREATEST((SELECT COALESCE(MAX("id"), 1) FROM "ORDER_ITEMS"), 1), true);
SELECT setval(pg_get_serial_sequence('"ORDER_PAYMENTS"', 'id'), GREATEST((SELECT COALESCE(MAX("id"), 1) FROM "ORDER_PAYMENTS"), 1), true);
SELECT setval(pg_get_serial_sequence('"ORDER_STATUS"', 'id'), GREATEST((SELECT COALESCE(MAX("id"), 1) FROM "ORDER_STATUS"), 1), true);
SELECT setval(pg_get_serial_sequence('"GUEST_CHECKOUT"', 'id'), GREATEST((SELECT COALESCE(MAX("id"), 1) FROM "GUEST_CHECKOUT"), 1), true);

COMMIT;
