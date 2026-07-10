# Alaba Marketplace Backend — Platform Audit Report

**Date:** June 2026  
**Prepared by:** Engineering Team  
**Codebase:** NestJS 10 + PostgreSQL (Sequelize ORM)  
**Scope:** Static code audit — feature coverage, security posture, data integrity, scalability, and code quality  
**Total TypeScript Files:** ~731 across 73 modules  

---

## Executive Summary

The Alaba Marketplace backend has a well-organized, production-deployed NestJS monolith that covers the core marketplace loop: user registration, store management, product catalogues, multi-seller orders, Paystack payments with subaccounts and splits, refunds, delivery logistics, subscriptions, notifications, and basic analytics. The architecture is sound and several critical safety mechanisms (JWT auth, RBAC, webhook signature verification, database transactions on payment paths) are correctly implemented.

However, the platform has meaningful gaps across **security hardening**, **data integrity**, **operational reliability**, and **missing marketplace features** that will need to be addressed before the platform can scale confidently or meet the expectations of a mature multi-seller marketplace. These gaps fall into two buckets: things that increase risk right now (security, data loss, payment edge cases) and things that limit the product roadmap (returns, disputes, seller wallet, promotions, etc.).

This report documents both buckets with evidence from the codebase, a priority ranking, and recommended next steps.

---

## Part 1 — What Is Already Built

The following table summarizes modules that are fully implemented and production-ready based on the code review.

| Area | Modules / Features | Status |
|---|---|---|
| Auth & Users | JWT auth, RBAC (5 roles), session blacklist, password recovery | ✅ Done |
| Stores | Seller registration, approval fields, store profiles, store search | ✅ Done |
| Products | Catalogue, variants, images, bulk orders, reviews, ratings | ✅ Done |
| Orders | Authenticated + guest checkout, multi-seller, OTP delivery verification, pickup code | ✅ Done |
| Order Status | 13 states with history log, OrderLog entity | ✅ Done |
| Payments | Paystack integration, webhook with HMAC-SHA512 verification | ✅ Done |
| Payment Splits | Multi-seller settlement splits, subaccounts, auto-split on checkout | ✅ Done |
| Refunds | Refund request entity, approval workflow, auto-approve flag | ✅ Done |
| Delivery | Delivery companies, drivers, distance/weight-based charges | ✅ Done |
| Subscriptions | Subscription plans, boost requests for sellers | ✅ Done |
| Notifications | Firebase push notifications, mail queue (Bull) | ✅ Done |
| Admin | Super admin service, audit log (admin actions), dashboard | ✅ Done |
| Content | Banners, categories, menus, news/blogs, offers, landing | ✅ Done |
| Enquiries | Basic buyer-seller enquiry system | ✅ Done |
| Invoices | Invoice + invoice items generation (Puppeteer PDF) | ✅ Done |
| Search | Basic PostgreSQL LIKE product/store search | ✅ Done |
| Wishlist | Wishlist entity per user | ✅ Done |
| Cart | Cart with qty validation (min 1, max 25), multi-seller cart | ✅ Done |

---

## Part 2 — Security Findings

### 2.1 No Rate Limiting  
**Severity: HIGH**  
`@nestjs/throttler` is not installed. There is no rate limiting on any endpoint, including login, signup, password reset, or payment initiation.

**Risk:** Brute-force attacks on authentication, credential stuffing, and API abuse are trivially possible.  
**Fix:** Install `@nestjs/throttler` and apply a `ThrottlerGuard` globally with tighter limits on auth endpoints.

---

### 2.2 Two-Factor Authentication (2FA) Not Implemented  
**Severity: HIGH**  
Firebase OTP integration exists in the codebase but is commented out (`src/USER_AUTH/auth.service.ts`). No TOTP or SMS-based 2FA is available, including for admin and seller accounts.

**Risk:** Compromised seller or admin credentials give full access to the platform with no second factor.  
**Fix:** Re-enable OTP for high-privilege accounts (admins, sellers) using Firebase or a TOTP library (speakeasy).

---

### 2.3 Webhook Idempotency Not Enforced  
**Severity: MEDIUM-HIGH**  
The Paystack webhook handler (`paystack.service.ts`) checks if a payment's status is already `"success"` before processing, which provides some protection. However, there is no idempotency key log — processed webhook event IDs are not stored, so a repeated delivery of the same Paystack webhook event (a common behavior when Paystack does not receive a 200 OK in time) could be processed more than once under race conditions.

**Risk:** Duplicate payment processing, double inventory decrements, or double settlement crediting under load.  
**Fix:** Create a `WebhookEvent` table that stores processed Paystack event IDs. Check before processing; skip and return 200 if already seen.

---
 b
### 2.4 No Security Headers (Helmet)  
**Severity: MEDIUM**  
The `helmet` package is not configured in `main.ts`. The application is missing standard HTTP security headers: `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, `Content-Security-Policy`, etc.

**Fix:** Add `app.use(helmet())` in `main.ts`.

---

### 2.5 No Startup Validation of Required Environment Variables  
**Severity: MEDIUM**  
Critical environment variables (`DATABASE_HOST`, `JWT_SECRET`, `PAYSTACK_SECRET_KEY`, `PAYSTACK_WEBHOOK_SECRET`) are read without validation at startup. A misconfigured deployment will appear to start successfully but fail at runtime on the first request.

**Fix:** Add a config validation schema using `Joi` in the `ConfigModule` to fail fast on startup if required vars are missing.

---

### 2.6 Stripe Integration Remnants  
**Severity: LOW**  
`RefundRequest` entity (`src/REFUND_REQUEST/refund-request.entity.ts`) has `stripe_refund_id` and `stripe_refund_response` fields, but Paystack is the only payment gateway. These fields suggest an abandoned migration from Stripe that was never cleaned up.

**Risk:** Confuses future developers; may indicate an incomplete refund integration path.  
**Fix:** Remove Stripe fields from `RefundRequest` or document that they are reserved for future use.

---

## Part 3 — Data Integrity Findings

### 3.1 Inconsistent Soft-Delete Strategy  
**Severity: HIGH**  
Soft deletes are implemented three different ways across the codebase:
- Some entities use Sequelize's `paranoid: true` (e.g., `NEW_DISTANCE_CHARGE`, `SUBSCRIPTION_PLANS`, `BOOST_REQUESTS`)
- Some entities use manual `is_deleted` + `deleted_at` fields (e.g., `User`)
- Most entities (e.g., `Order`, `Product`, `Store`) have **no soft-delete at all**

**Risk:** Accidental hard deletes, inability to audit deleted records, cascading issues when related records are wiped.  
**Fix:** Pick one strategy (recommend `paranoid: true` for consistency with Sequelize) and apply it uniformly across all entities.

---

### 3.2 Missing Database Transactions in Guest Order Flow  
**Severity: HIGH**  
`guest-order.service.ts` (2,000+ lines) handles guest checkout, cart validation, stock deduction, and order creation. This critical path does **not** wrap its operations in a database transaction.

**Risk:** If any step fails mid-creation (e.g., stock deduction succeeds but order creation fails), the database is left in an inconsistent state — inventory decremented with no order record.  
**Fix:** Wrap the guest order creation flow in a `sequelize.transaction()` block, consistent with how `paystack.service.ts` already handles payment webhooks.

---

### 3.3 No Comprehensive Migration History  
**Severity: HIGH**  
Only one migration file exists (`20190128160000-create-table-user.js`), dated 2019. The application has 39+ entities with no corresponding schema migration history.

**Risk:** Database schema cannot be reliably reproduced on a new environment. Schema drift between environments is undetectable. Disaster recovery is impaired.  
**Fix:** Retroactively generate migrations to match the current entity definitions and enforce migration-first development going forward.

---

### 3.4 Order ID Generation Using Timestamp  
**Severity: MEDIUM**  
Order IDs are generated using `Math.round(+new Date() / 10)` — a timestamp-derived integer. Under concurrent load, this can generate duplicate order IDs.

**Risk:** Order ID collisions under load, or predictable IDs that expose order volume to competitors.  
**Fix:** Use a UUID, a sequence, or a cryptographically random alphanumeric ID instead.

---

### 3.5 No Optimistic Locking for Concurrent Updates  
**Severity: MEDIUM**  
There is no version field or optimistic locking on stock/inventory or order fields. Two simultaneous requests to purchase the last item in stock could both succeed.

**Fix:** Add a `version` field to `Product`/`ProductVariant` and use Sequelize's `lock: transaction.LOCK.UPDATE` (already used in payment handlers) on inventory reads in the order creation flow.

---

## Part 4 — Scalability & Infrastructure Findings

### 4.1 In-Memory Cache (No Redis)  
**Severity: HIGH**  
The application uses `cache-manager` with in-memory storage (configured at 48-hour TTL, max 200 items in `app.module.ts:82-86`). Session blacklists and settings are cached in-process.

**Risk:** On any server restart, all cached sessions are lost — previously blacklisted tokens would be valid again until they expire naturally. In a multi-instance deployment, blacklists would not be shared across instances.  
**Fix:** Replace in-memory cache-manager store with `cache-manager-ioredis` backed by Redis.

---

### 4.2 No Full-Text Search Engine  
**Severity: MEDIUM-HIGH**  
Product and store search uses PostgreSQL `LIKE '%query%'` queries. There is no Elasticsearch, Typesense, or Meilisearch integration.

**Risk:** Poor search relevance, no typo tolerance, no faceted filtering, and slow queries at scale with large product catalogues.  
**Fix:** Integrate Typesense or Meilisearch (easier to operate than Elasticsearch) for product search with facets, typo tolerance, and ranking.

---

### 4.3 Bull Queue Underutilized  
**Severity: MEDIUM**  
`@nestjs/bull` is installed and a mail queue is configured, but the queue is only used for enquiry emails. Order confirmation emails, settlement calculations, webhook processing, and inventory updates are all done synchronously in the request-response cycle.

**Risk:** Slow response times on critical paths (checkout, payment webhook), missed emails on failure, no retry logic for transient failures.  
**Fix:** Move all email sends, settlement calculations, and long-running order post-processing into Bull queue jobs with retry strategies.

---

### 4.4 No Circuit Breaker on External API Calls  
**Severity: MEDIUM**  
All Paystack API calls (`axios.post()` in `paystack.service.ts`) are direct HTTP calls with no retry logic, timeout tuning, or circuit breaker pattern.

**Risk:** If Paystack experiences degraded performance, requests pile up in the NestJS event loop. A slow Paystack response blocks the checkout thread.  
**Fix:** Add request timeouts, exponential backoff for retries, and a circuit breaker (e.g., `opossum`) on all external API calls.

---

### 4.5 No Health Check Endpoint  
**Severity: LOW-MEDIUM**  
There is no `/health` or `/ready` endpoint.

**Risk:** Load balancers and container orchestrators (Kubernetes, ECS) cannot verify instance health. An instance with a dead database connection continues receiving traffic.  
**Fix:** Add `@nestjs/terminus` health checks for database connectivity, Redis, and external dependencies.

---

## Part 5 — Missing Marketplace Features (Product Roadmap Gaps)

These are features that are common expectations for a mature multi-seller marketplace but are not yet present in the codebase.

### 5.1 Product & Catalog Moderation  
Products have `active`/`inactive` status fields, but there is no marketplace-level content safety workflow: no admin moderation queue, no prohibited item flags, no product takedown with reason tracking, no re-approval after seller edits, and no duplicate detection.

**Impact:** Cannot enforce seller compliance, content quality standards, or respond to abuse reports on products.

---

### 5.2 Full Returns / RMA System  
A `RefundRequest` entity exists at the order level, but a proper marketplace needs:
- Item-level return reasons
- Return window enforcement (e.g., 7-day window)
- Photo/evidence uploads
- Reverse logistics tracking
- Inspection status by seller
- Exchange/replacement flows
- Separate refund rules per seller

**Impact:** Buyers cannot formally request returns. Sellers have no workflow for processing returns. Dispute escalation has no foundation.

---

### 5.3 Inventory Reservation and Stock Ledger  
Products have `unit`/`units` fields, but there is no:
- Stock reservation during checkout (hold stock until payment confirmed)
- Release of reserved stock on payment failure or cart expiry
- Stock movement log (purchases, restocks, adjustments)
- Low-stock alerts for sellers
- Damaged/lost stock adjustments

**Impact:** Overselling is possible. Inventory accuracy degrades over time with no audit trail.

---

### 5.4 Promotion and Coupon Engine  
Offer and discount fields exist on products, but there is no platform-level or seller-level coupon system: no coupon codes, no usage limits, no campaign date windows, no minimum cart values, no category/store targeting, no first-order discounts, and no fraud controls.

**Impact:** Cannot run platform-wide promotions, seasonal sales, or seller-specific discounts.

---

### 5.5 Dispute and Support Center  
An `Enquiries` module exists for basic questions, but there is no formal dispute workflow: no buyer-initiated dispute, no admin mediation interface, no SLA tracking, no escalation path, no attachments, and no resolution history.

**Impact:** Buyer-seller conflicts have no structured resolution path. This is a regulatory and trust risk for the platform.

---

### 5.6 Buyer-Seller Messaging  
There is no in-platform messaging between buyers and sellers. The `Enquiries` module covers some pre-sale questions but has no:
- Order-scoped chat threads
- Attachment support (images/docs)
- Unread message counts
- Message reporting/moderation
- Notification hooks for new messages

**Impact:** Buyers and sellers are forced off-platform to communicate, reducing trust and accountability.

---

### 5.7 Shipment Tracking  
Delivery companies and drivers are modelled in the system, but there is no:
- Shipment/tracking event log
- Carrier reference number tracking
- Driver assignment lifecycle (assigned → picked up → en route → delivered)
- Failed delivery attempt handling and rescheduling
- Proof-of-delivery capture
- Buyer-visible tracking page

**Impact:** Buyers have no visibility into their delivery. Drivers have no structured workflow. Delivery SLA cannot be measured.

---

### 5.8 Seller Wallet and Payout Ledger  
Paystack subaccounts and a `Settlements` module exist, but there is no seller-facing wallet with:
- Ledger of credits (sales) and debits (refunds, fees, chargebacks)
- Pending vs. available balance
- Payout batch management and failure handling
- Commission and fee line items
- Downloadable statements

**Impact:** Sellers cannot track their earnings. Disputes over settlements have no transparent audit trail.

---

### 5.9 Commission, Tax, and Fee Rules Engine  
`Store.percentage_charge` (default 93.5%) defines commission, but there is no:
- Configurable commission tiers (by seller plan, GMV tier, or category)
- VAT/tax invoice generation per transaction
- Marketplace service fee line items
- Delivery fee allocation rules
- Per-country tax rules

**Impact:** Platform cannot adapt pricing strategy, offer seller tiers, or meet tax reporting obligations at scale.

---

### 5.10 Fraud and Risk Controls  
There are no fraud detection mechanisms:
- No velocity checks (multiple orders from same IP/device in short window)
- No suspicious order scoring
- No device/IP fingerprinting
- No blocked users/cards/phones list
- No manual review queue for flagged transactions
- No guest checkout risk scoring

**Impact:** Platform is exposed to card testing, account takeover, and refund fraud.

---

### 5.11 Seller KYC / Compliance Lifecycle  
Basic seller approval fields exist, but there is no:
- Document expiry tracking
- KYB (Know Your Business) verification provider integration
- Resubmission workflow for rejected documents
- Compliance hold (block payouts without suspending store)
- Suspension with reason codes and appeal flow

**Impact:** Regulatory compliance obligations for a financial marketplace (CBN guidelines for payment facilitators) cannot be met.

---

### 5.12 Advanced Analytics  
A `Dashboard` module exists, but there are no structured analytics for:
- GMV, AOV, conversion funnel
- Seller performance (sell-through rate, cancellation rate, response time)
- Refund rate and chargeback rate
- Delivery SLA attainment
- Product ranking analytics for sellers

**Impact:** Neither the platform team nor sellers can make data-driven decisions.

---

## Part 6 — Code Quality Findings

### Strengths
- Clean one-folder-per-feature module structure across 73 modules
- Strong use of DTOs with class-validator decorators throughout
- Consistent naming conventions (snake_case for DB columns, camelCase for DTOs)
- Proper NestJS dependency injection everywhere
- Auth guard correctly validates JWT and checks session blacklist
- Payment webhook HMAC-SHA512 verification is correctly implemented
- Database transactions used properly in the payment critical path
- Swagger documentation auto-generated (disabled in production)
- Comprehensive entity schemas (Order entity has 45+ fields covering multi-seller, guest, and pickup scenarios)

### Weaknesses
- `guest-order.service.ts` and `paystack.service.ts` are each 2,000+ lines — these should be split into focused service classes
- Copy/backup files left in the repository (`order.entity copy.ts`, `main copy.ts`, `nodemon copy.json`)
- Debug comments and `console.log` calls left in production order controller code
- Firebase OTP code is commented out without a replacement, leaving a commented block in an active service
- Audit logging is isolated to the `SUPER_ADMIN` module; no application-wide audit trail
- Payment gateway is tightly coupled to Paystack; no abstraction layer for adding a second gateway
- Error handling is inconsistent: some services throw `HttpException`, others return `{ success: false, message }` objects

---

## Part 7 — Recommended Priority Roadmap

### Immediate (Security & Data Loss Risk)

| # | Task | Rationale |
|---|---|---|
| 1 | Install `@nestjs/throttler` and apply rate limiting to auth and payment endpoints | Prevents brute-force and DDoS on critical paths |
| 2 | Implement webhook idempotency key logging | Prevents duplicate payment processing under load |
| 3 | Wrap `guest-order.service.ts` creation flow in a database transaction | Prevents inventory/order state inconsistency on partial failures |
| 4 | Replace in-memory cache with Redis | Makes session blacklisting reliable across restarts and instances |
| 5 | Add Helmet security headers to `main.ts` | Closes common HTTP header vulnerability vectors |
| 6 | Validate required environment variables at startup | Prevents silent misconfiguration in production |

### Short-Term (Platform Reliability)

| # | Task |
|---|---|
| 7 | Generate database migrations for all 39 existing entities |
| 8 | Standardize soft-delete to `paranoid: true` across all entities |
| 9 | Fix Order ID generation (replace timestamp-based IDs with UUIDs) |
| 10 | Add `/health` endpoint using `@nestjs/terminus` |
| 11 | Add circuit breaker/retry logic to all Paystack API calls |
| 12 | Expand Bull queue usage to cover email, settlement, and order post-processing |

### Medium-Term (Product Features)

| # | Task |
|---|---|
| 13 | Build inventory reservation and stock ledger |
| 14 | Build full returns/RMA system |
| 15 | Build promotion and coupon engine |
| 16 | Build seller wallet ledger and payout management |
| 17 | Build shipment tracking event log and buyer-facing tracking |
| 18 | Build dispute and support center |
| 19 | Build product moderation queue |

### Long-Term (Scale & Growth)

| # | Task |
|---|---|
| 20 | Integrate full-text search engine (Typesense recommended) |
| 21 | Implement 2FA for admin and seller accounts |
| 22 | Build fraud/risk scoring engine |
| 23 | Build advanced analytics and seller performance dashboards |
| 24 | Add API versioning strategy |
| 25 | Add structured (JSON) logging and APM integration |

---

## Appendix A — Key Files Referenced

| File | Significance |
|---|---|
| `src/app.module.ts:76-86` | Module registration, cache config (in-memory, 48h TTL) |
| `src/ORDER/guest-order.service.ts` | 2,000+ line guest checkout — missing transactions |
| `src/PAYSTACK_PAYMENT/paystack.service.ts` | 2,100+ lines, webhook handler at ~line 2150 |
| `src/USER_AUTH/auth.service.ts` | Commented-out Firebase OTP block |
| `src/REFUND_REQUEST/refund-request.entity.ts:47` | Stripe fields inconsistency |
| `src/ORDER/order.entity.ts:40+` | 45-field order schema, multi-seller + guest support |
| `src/STORES/store.entity.ts:111` | `percentage_charge` field (default 93.5%) |
| `src/SUPER_ADMIN/super-admin.service.ts` | Only location with `AdminAuditLog` usage |
| `src/CALCULATE_DELIVERY_CHARGE/calculate_delivery.service.ts` | TODO: Re-enable admin approval check |
| `src/shared/guards/auth.guard.ts` | JWT + blacklist verification |

---

## Appendix B — Installed vs. Missing Dependencies

### Present
`@nestjs/bull`, `@nestjs/cache-manager`, `@nestjs/jwt`, `@nestjs/passport`, `@nestjs/scheduler`, `@nestjs/swagger`, `@nestjs/sequelize`, `sequelize-typescript`, `firebase-admin`, `paystack`, `axios`, `bcrypt`, `sharp`, `puppeteer`, `socket.io`

### Missing (Recommended Additions)
`@nestjs/throttler`, `ioredis` / `cache-manager-ioredis`, `helmet`, `@nestjs/terminus`, `speakeasy` (2FA), `typesense` (search), `joi` (config validation), `opossum` (circuit breaker)

---

*This report is based on static code analysis as of the audit date. Dynamic/runtime behaviors, environment configuration, and third-party integrations were not live-tested. Findings should be validated against the running production environment before remediation work begins.*
