-- ============================================
-- PAYSTACK RECONCILIATION QUERIES
-- ============================================

-- 1. Find orphaned Paystack payments (successful but not in orders)
SELECT 
  pl.reference,
  pl.amount,
  pl.email,
  pl.metadata,
  pl."createdAt",
  COUNT(op.id) as order_payment_links
FROM "PAYMENT_LOG" pl
LEFT JOIN "ORDER_PAYMENTS" op ON pl.reference = op.ref
WHERE pl.status = 'success'
  AND op.id IS NULL
GROUP BY pl.reference, pl.amount, pl.email, pl.metadata, pl."createdAt"
ORDER BY pl."createdAt" DESC
LIMIT 50;

-- 2. Find unprocessed guest checkouts with successful payments
SELECT 
  gc.id,
  gc.reference,
  gc.guest_email,
  gc.status,
  gc.payment_status,
  gc.amount_kobo,
  gc.order_ids,
  gc."createdAt",
  gc."processed_at"
FROM "GUEST_CHECKOUT" gc
WHERE gc.payment_status = 'success'
  AND gc.status != 'completed'
ORDER BY gc."createdAt" DESC
LIMIT 50;

-- 3. Orders with "pay online" payment type but no ORDER_PAYMENTS record
SELECT 
  o.id,
  o.order_id,
  o."paymentType",
  o.payment_reference,
  o."createdAt",
  COUNT(op.id) as payment_records
FROM "ORDER" o
LEFT JOIN "ORDER_PAYMENTS" op ON o.id = op."orderId"
WHERE o."paymentType" = 'pay online'
  AND op.id IS NULL
GROUP BY o.id, o.order_id, o."paymentType", o.payment_reference, o."createdAt"
ORDER BY o."createdAt" DESC
LIMIT 50;

-- 4. Summary Statistics
SELECT 
  (SELECT COUNT(*) FROM "ORDER_PAYMENTS" WHERE status = 'success') as successful_payments_recorded,
  (SELECT COUNT(*) FROM "PAYMENT_LOG" WHERE status = 'success') as successful_paystack_transactions,
  (SELECT COUNT(*) FROM "ORDER" WHERE "paymentType" = 'pay online') as online_orders_created,
  (SELECT COUNT(*) FROM "ORDER" WHERE "paymentType" = 'cash-on-delivery') as cash_orders_created,
  (SELECT COUNT(*) FROM "GUEST_CHECKOUT" WHERE status = 'completed') as completed_guest_checkouts,
  (SELECT COUNT(*) FROM "GUEST_CHECKOUT" WHERE status != 'completed' AND payment_status = 'success') as unprocessed_successful_guest_checkouts;

-- 5. Find payment references in ORDER table but not in ORDER_PAYMENTS
SELECT 
  o.id,
  o.order_id,
  o.payment_reference,
  o."paymentType",
  o.guest_email,
  o.total,
  o."createdAt"
FROM "ORDER" o
WHERE o.payment_reference IS NOT NULL
  AND o."paymentType" = 'pay online'
  AND NOT EXISTS (
    SELECT 1 FROM "ORDER_PAYMENTS" op 
    WHERE op."orderId" = o.id OR op.ref = o.payment_reference
  )
ORDER BY o."createdAt" DESC
LIMIT 50;

-- 6. Orders created from PaymentLog but reference not found
SELECT 
  pl.reference,
  pl.amount,
  pl.email,
  pl.status,
  pl."createdAt",
  (SELECT COUNT(*) FROM "ORDER" WHERE payment_reference = pl.reference) as orders_with_this_ref
FROM "PAYMENT_LOG" pl
WHERE pl.status = 'success'
  AND pl.reference IS NOT NULL
  AND (SELECT COUNT(*) FROM "ORDER" WHERE payment_reference = pl.reference) = 0
ORDER BY pl."createdAt" DESC
LIMIT 50;
