# Paystack Reconciliation Guide

## Overview
This guide helps identify and resolve discrepancies between Paystack payments and your database orders.

## Problem Scenarios

### 1. **Orphaned Paystack Payments**
- ✗ Payment succeeded on Paystack
- ✗ Payment logged in `PAYMENT_LOG` table
- ✗ But NO corresponding order created
- **Cause**: Webhook failed, network issue, or order creation logic failed

### 2. **Unprocessed Guest Checkouts**
- ✗ Guest checkout has successful payment (`payment_status = 'success'`)
- ✗ But checkout status is not 'completed'
- **Cause**: Guest checkout → order conversion failed

### 3. **Missing ORDER_PAYMENTS Records**
- ✗ Order exists with `paymentType = 'pay online'`
- ✗ Payment reference exists in `ORDER.payment_reference`
- ✗ But NO record in `ORDER_PAYMENTS` table
- **Cause**: Order created but payment tracking wasn't recorded

### 4. **Mismatched Payment References**
- ✗ Order has a `payment_reference`
- ✗ But that reference doesn't exist in `PAYMENT_LOG` or `ORDER_PAYMENTS`
- **Cause**: Manual order creation or reference typo

## How to Use Reconciliation Tools

### Via REST API (Admin Only)

#### 1. Find Orphaned Paystack Payments
```bash
GET /paystack/reconciliation/orphaned-payments
Authorization: Bearer <admin-token>
```

Returns:
- Count of orphaned payments
- List of payment references that need investigations
- Payment amounts and email addresses

#### 2. Check Unprocessed Guest Checkouts
```bash
GET /paystack/reconciliation/orphaned-guest-checkout
Authorization: Bearer <admin-token>
```

Returns:
- Guest checkouts with successful payments not yet converted to orders
- Reference numbers for tracing

#### 3. Generate Full Reconciliation Report
```bash
GET /paystack/reconciliation/full-report
Authorization: Bearer <admin-token>
```

Returns comprehensive summary:
- Total orders with payment references
- Total orphaned payments
- Total unprocessed guest checkouts
- Recommendations for next steps

#### 4. Audit ORDER ↔ ORDER_PAYMENTS Mismatches
```bash
GET /paystack/reconciliation/audit-mismatches
Authorization: Bearer <admin-token>
```

Returns:
- Orders without payment records
- Orders with missing payment reference mappings

### Via Direct Database Queries

Use the SQL queries in `paystack-reconciliation.sql`:

1. **Query 1**: Find orphaned payments (successful Paystack but not in ORDER_PAYMENTS)
2. **Query 2**: Find unprocessed guest checkouts
3. **Query 3**: Find online orders without ORDER_PAYMENTS
4. **Query 4**: Get summary statistics
5. **Query 5**: Find ORDER payment references but not ORDER_PAYMENTS
6. **Query 6**: Orders created from PaymentLog but reference not found

## Resolution Steps

### For Orphaned Paystack Payments

**Option A: Create Missing Order (if guest checkout never processed)**
```typescript
// Manually create order from payment data
const paymentData = await paymentLog.findOne({ reference: 'ORPHANED_REF' });
await guestOrderService.createGuestOrder({
  guest_email: paymentData.email,
  guest_phone: paymentData.phone,
  items: paymentData.metadata.items,
  payment_reference: paymentData.reference,
  // ... other fields from payment metadata
});
```

**Option B: Refund Payment (if insufficient data)**
```bash
# Initiate refund through Paystack API if order can't be recovered
POST /paystack/initiate-refund
{
  reference: "ORPHANED_REF",
  reason: "order_not_created_from_payment"
}
```

### For Unprocessed Guest Checkouts

```typescript
// Trigger the guest checkout → order conversion
await guestCheckoutService.finalizeCheckout(checkoutId);
```

### For Missing ORDER_PAYMENTS Records

```typescript
// Create missing payment record
await orderPaymentsRepository.create({
  orderId: order.id,
  ref: order.payment_reference,
  status: 'success',
  amount: order.total,
  gateway: 'paystack',
  // ... other fields
});
```

## Data Structure Reference

### PAYMENT_LOG
- `reference`: Paystack transaction reference
- `status`: 'success', 'failed', 'abandoned'
- `email`: Customer email from Paystack
- `amount`: Amount in kobo
- `metadata`: Full Paystack response (contact info, items, etc.)

### ORDER_PAYMENTS
- `orderId`: Links to ORDER.id
- `ref`: Payment reference (should match PAYMENT_LOG.reference)
- `status`: 'success', 'failed', 'pending'
- `amount`: Amount paid

### GUEST_CHECKOUT
- `reference`: Unique checkout reference
- `payment_status`: 'pending', 'success', 'failed'
- `status`: 'completed', 'abandoned', 'pending'
- `order_ids`: JSON array of created ORDER ids

### ORDER
- `paymentType`: 'cash-on-delivery', 'pay online'
- `payment_reference`: Links to PAYMENT_LOG.reference or ORDER_PAYMENTS.ref
- `is_guest_order`: boolean flag for guest orders
- `guest_email`: Email for guest orders

## Common Query Patterns

### Check a specific payment reference
```sql
-- Find the payment
SELECT * FROM PAYMENT_LOG WHERE reference = 'ORDER_1764224310250_OL0UO2';

-- Check if order was created
SELECT * FROM ORDER WHERE payment_reference = 'ORDER_1764224310250_OL0UO2';

-- Check if payment was recorded
SELECT * FROM ORDER_PAYMENTS WHERE ref = 'ORDER_1764224310250_OL0UO2';
```

### Get all failed→success payment transitions
```sql
SELECT 
  reference,
  status,
  email,
  createdAt
FROM PAYMENT_LOG
WHERE reference IN (
  SELECT reference FROM PAYMENT_LOG 
  WHERE status = 'failed'
) AND status = 'success'
ORDER BY createdAt;
```

## Monitoring

### Add to your monitoring/alerting:
1. Daily check for new orphaned payments
2. Alert if orphaned payment count grows
3. Track percentage of payments that create orders
4. Monitor guest checkout completion rate

## Integration with Paystack Webhook

The reconciliation tools identify failures in this flow:

```
Paystack Payment → Webhook Received → Create ORDER_PAYMENTS → Convert to ORDER
```

If you see orphaned payments:
1. Check Paystack webhook delivery logs
2. Verify webhook endpoint health
3. Check for errors in order creation service
4. Review error logs around payment timestamp
