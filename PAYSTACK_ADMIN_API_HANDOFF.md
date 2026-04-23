# Paystack Admin API Handoff

All routes below are admin-only.

Auth header:

```http
Authorization: Bearer <token>
```

Base URL prefix:

```http
/admin/paystack/subaccounts
```

## 1. Migrate Pending Stores

```http
POST /admin/paystack/subaccounts/migrate
```

Query params:

```json
{
  "dryRun": true,
  "force": false
}
```

Use for:
- migrate all pending local store subaccounts into the new Paystack account

Typical response:

```json
{
  "statusCode": 200,
  "status": true,
  "message": "Pending Paystack subaccount migration preview generated successfully",
  "data": {
    "dryRun": true,
    "force": false,
    "summary": {
      "total": 120,
      "success": 0,
      "failed": 0,
      "preview": 120,
      "skipped": 0
    },
    "results": [
      {
        "store_id": 4548,
        "store_name": "Seller Store",
        "result": "preview",
        "legacy_subaccount_code": "ACCT_OLD_123",
        "new_subaccount_code": null
      }
    ]
  }
}
```

## 2. Retry Failed Migrations

```http
POST /admin/paystack/subaccounts/migrate/retry-failed
```

Query params:

```json
{
  "dryRun": true,
  "force": true
}
```

Use for:
- retry stores whose migration previously failed

## 3. Migrate One Store

```http
POST /admin/paystack/subaccounts/migrate/:storeId
```

Path param:
- `storeId: number`

Query params:

```json
{
  "dryRun": true,
  "force": false
}
```

Use for:
- migrate one specific store only

## 4. Migration Status List

```http
GET /admin/paystack/subaccounts/migration-status
```

Query params:

```json
{
  "status": "pending",
  "page": 1,
  "limit": 50
}
```

Allowed `status`:
- `pending`
- `success`
- `failed`

Typical response:

```json
{
  "statusCode": 200,
  "status": true,
  "message": "Paystack subaccount migration status fetched successfully",
  "data": {
    "summary": {
      "pending": 100,
      "success": 2500,
      "failed": 12
    },
    "stores": [
      {
        "id": 4548,
        "store_name": "Seller Store",
        "paystack_subaccount_code_new": "ACCT_NEW_4548",
        "paystack_subaccount_migration_status": "success"
      }
    ]
  }
}
```

## 5. Migration Status CSV

```http
GET /admin/paystack/subaccounts/migration-status/report.csv
```

Query params:

```json
{
  "status": "failed"
}
```

Use for:
- export migration status as CSV

## 6. Update Percentage

```http
POST /admin/paystack/subaccounts/update-percentage
```

Body:

```json
{
  "percentage_charge": 93.5,
  "storeIds": [4548, 4467],
  "dryRun": true
}
```

Fields:
- `percentage_charge?: number`
- `storeIds?: number[]`
- `dryRun?: boolean`

Frontend note:
- Use this after stores have already been linked to `paystack_subaccount_code_new`
- Run with `dryRun: true` first to show an admin preview/confirmation screen
- This is the route that pushes the platform share to Paystack and keeps local seller share in sync

Important meaning:
- `percentage_charge` is seller share
- backend sends `6.5` to Paystack if seller share is `93.5`

Typical preview response:

```json
{
  "statusCode": 200,
  "status": true,
  "message": "Paystack subaccount percentage update preview generated successfully",
  "data": {
    "dryRun": true,
    "percentage_charge": 93.5,
    "company_percentage": 6.5,
    "paystack_percentage_charge": 6.5,
    "summary": {
      "total": 2719,
      "remote_total": 3320,
      "local_targetable_total": 2719,
      "targeted_remote_total": 3001,
      "unmatched_remote_total": 319,
      "updated": 0,
      "failed": 0,
      "preview": 2719,
      "failed_store_ids": []
    },
    "results": [
      {
        "store_id": 4548,
        "store_name": "Seller Store",
        "result": "preview",
        "subaccount_code": "ACCT_NEW_4548",
        "target_subaccount_codes": ["ACCT_NEW_4548"],
        "previous_percentage_charge": 95,
        "next_percentage_charge": 93.5,
        "company_percentage": 6.5,
        "paystack_percentage_charge": 6.5
      }
    ]
  }
}
```

Typical live response:

```json
{
  "statusCode": 200,
  "status": true,
  "message": "Paystack subaccount percentages updated successfully",
  "data": {
    "dryRun": false,
    "percentage_charge": 93.5,
    "company_percentage": 6.5,
    "paystack_percentage_charge": 6.5,
    "summary": {
      "total": 2719,
      "remote_total": 3320,
      "local_targetable_total": 2719,
      "targeted_remote_total": 3001,
      "unmatched_remote_total": 319,
      "updated": 2715,
      "failed": 4,
      "preview": 0,
      "failed_store_ids": [1022, 1880, 2991, 4550]
    },
    "results": [
      {
        "store_id": 4548,
        "store_name": "Seller Store",
        "result": "updated",
        "subaccount_code": "ACCT_NEW_4548",
        "target_subaccount_codes": ["ACCT_NEW_4548"],
        "percentage_charge": 93.5,
        "company_percentage": 6.5,
        "paystack_percentage_charge": 6.5
      }
    ]
  }
}
```

## 7. Sync New Codes

```http
POST /admin/paystack/subaccounts/sync-new-codes
```

Body:

```json
{
  "dryRun": true,
  "force": false,
  "storeIds": [4548, 4467],
  "perPage": 100,
  "maxPages": 40
}
```

Fields:
- `dryRun?: boolean`
- `force?: boolean`
- `storeIds?: number[]`
- `perPage?: number`
- `maxPages?: number`

Use for:
- match copied Paystack subaccounts back to local stores
- populate `paystack_subaccount_code_new`

Frontend note:
- Use this before `update-percentage` if newly copied Paystack subaccounts have not been linked locally yet
- Show `ambiguous` rows to admin for manual cleanup instead of auto-confirming them

Typical response:

```json
{
  "statusCode": 200,
  "status": true,
  "message": "Paystack new-subaccount sync preview generated successfully",
  "data": {
    "dryRun": true,
    "force": false,
    "summary": {
      "localCandidates": 2739,
      "remoteSubaccounts": 3320,
      "matched": 2749,
      "updated": 0,
      "ambiguous": 14,
      "skippedExistingNewCode": 0
    },
    "results": [
      {
        "result": "preview",
        "store_id": 3194,
        "store_name": "Chommy chocolate",
        "subaccount_code": "ACCT_j462vg2ozr3wt9b",
        "remote_business_name": "Chommy chocolate",
        "seller_percentage_charge": 93.5,
        "company_percentage_charge": 6.5
      },
      {
        "result": "ambiguous",
        "subaccount_code": "ACCT_abc123",
        "remote_business_name": "Test Store",
        "remote_account_number": "1234567890",
        "candidate_store_ids": [4101, 4102]
      }
    ]
  }
}
```

## 8. Unmatched Remote

```http
GET /admin/paystack/subaccounts/unmatched-remote
```

Query params:

```json
{
  "storeIds": [4548, 4467],
  "page": 1,
  "limit": 100
}
```

Fields:
- `storeIds?: number[]`
- `page?: number`
- `limit?: number`

Use for:
- view Paystack subaccounts that are still not mapped to local stores used by the update flow

Frontend note:
- This should power an admin cleanup screen
- Group the list by `classification`
- Show `candidate_store_ids` and `reason` so admin can decide what to do

Typical response:

```json
{
  "statusCode": 200,
  "status": true,
  "message": "Unmatched remote Paystack subaccounts fetched successfully",
  "data": {
    "summary": {
      "remote_total": 3320,
      "local_store_total": 2719,
      "local_targetable_total": 2719,
      "targeted_remote_total": 3001,
      "unmatched_remote_total": 319,
      "page": 1,
      "limit": 100
    },
    "items": [
      {
        "subaccount_code": "ACCT_unmatched_1",
        "business_name": "Recoverable Store",
        "primary_contact_email": "seller@example.com",
        "primary_contact_phone": "08012345678",
        "account_number": "0999999999",
        "classification": "missing_local_link",
        "candidate_store_ids": [5001],
        "reason": "single_local_store_matches_account_number_but_has_no_new_code"
      },
      {
        "subaccount_code": "ACCT_orphan_1",
        "business_name": "Unknown Store",
        "primary_contact_email": "unknown@example.com",
        "primary_contact_phone": "08000000000",
        "account_number": "0000000000",
        "classification": "orphan",
        "candidate_store_ids": [],
        "reason": "no_local_store_with_matching_account_number"
      }
    ]
  }
}
```

Classification meanings:
- `duplicate_candidate`
- `missing_local_link`
- `ambiguous_candidate`
- `orphan`

Recommended UI labels:
- `duplicate_candidate` = "Duplicate Paystack record"
- `missing_local_link` = "Can be auto-linked"
- `ambiguous_candidate` = "Needs manual review"
- `orphan` = "No local store match"

## 9. Resolve Unmatched

```http
POST /admin/paystack/subaccounts/resolve-unmatched
```

Body:

```json
{
  "dryRun": true,
  "storeIds": [4548, 4467],
  "subaccountCodes": ["ACCT_abc123", "ACCT_xyz456"],
  "classifications": ["missing_local_link"],
  "page": 1,
  "limit": 100
}
```

Fields:
- `dryRun?: boolean`
- `storeIds?: number[]`
- `subaccountCodes?: string[]`
- `classifications?: string[]`
- `page?: number`
- `limit?: number`

Safe default:
- only resolve `missing_local_link`
- only when there is exactly one candidate store

Frontend note:
- Use this only from an admin review screen
- Always run preview first
- Only allow confirm if admin understands the affected store mappings

Preview response:

```json
{
  "statusCode": 200,
  "status": true,
  "message": "Resolvable unmatched remote Paystack subaccounts preview generated successfully",
  "data": {
    "dryRun": true,
    "filters": {
      "classifications": ["missing_local_link"],
      "subaccountCodes": null,
      "page": 1,
      "limit": 100
    },
    "summary": {
      "unmatched_remote_total": 319,
      "resolvable_total": 112,
      "preview": 100,
      "resolved": 0,
      "failed": 0
    },
    "results": [
      {
        "result": "preview",
        "classification": "missing_local_link",
        "subaccount_code": "ACCT_RECOVER",
        "business_name": "Recoverable Store",
        "account_number": "0999999999",
        "candidate_store_id": 5001,
        "candidate_store_name": "Recoverable Store",
        "next_percentage_charge": 93.5
      }
    ]
  }
}
```

Live response:

```json
{
  "statusCode": 200,
  "status": true,
  "message": "Resolvable unmatched remote Paystack subaccounts linked successfully",
  "data": {
    "dryRun": false,
    "filters": {
      "classifications": ["missing_local_link"],
      "subaccountCodes": null,
      "page": 1,
      "limit": 100
    },
    "summary": {
      "unmatched_remote_total": 319,
      "resolvable_total": 112,
      "preview": 0,
      "resolved": 100,
      "failed": 0
    },
    "results": [
      {
        "result": "resolved",
        "classification": "missing_local_link",
        "subaccount_code": "ACCT_RECOVER",
        "business_name": "Recoverable Store",
        "account_number": "0999999999",
        "candidate_store_id": 5001,
        "candidate_store_name": "Recoverable Store",
        "percentage_charge": 93.5
      }
    ]
  }
}
```

## Frontend Recommended Flow

1. `GET /unmatched-remote?page=1&limit=100`
2. Show grouped by `classification`
3. Allow preview on `POST /resolve-unmatched`
4. Allow confirm on `POST /resolve-unmatched` with `dryRun: false`
5. Rerun `POST /update-percentage`

## 10. Guest Purchases (Admin)

```http
GET /order/guest/all
```

Auth:
- admin only

Query params:

```json
{
  "page": 1,
  "take": 10,
  "status": "",
  "sort": "",
  "order": "DESC"
}
```

Fields:
- `page?: number`
- `take?: number`
- `status?: string`
- `sort?: string`
- `order?: "ASC" | "DESC"`

Use for:
- fetch all guest purchases
- includes paid-but-unfulfilled guest checkout records
- useful for an admin guest-orders screen

Frontend note:
- Use this for a dedicated "Guest Purchases" admin page
- This is separate from the seller split/migration tools
- If the frontend needs only guest purchases, use this instead of the manual settlement audit route

Typical response shape:

```json
{
  "statusCode": 200,
  "status": true,
  "message": "All guest orders retrieved successfully",
  "data": {
    "rows": [
      {
        "id": 101,
        "order_id": "ALB-000101",
        "is_guest_order": true,
        "guest_email": "guest@example.com",
        "guest_first_name": "Jane",
        "guest_last_name": "Doe",
        "guest_phone": "08012345678",
        "store": {
          "id": 22,
          "store_name": "Seller Store"
        }
      }
    ]
  }
}
```

## 11. Purchases That Do Not Go To Seller

```http
GET /paystack/manual-settlement/audit
```

Auth:
- admin only

Query params:

```json
{
  "page": 1,
  "take": 10,
  "storeId": 22,
  "reference": "PSK_REF_123",
  "buyerEmail": "buyer@example.com"
}
```

Fields:
- `page?: number`
- `take?: number`
- `storeId?: number`
- `reference?: string`
- `buyerEmail?: string`

Use for:
- fetch all non-split payments
- includes company-account collections
- includes older payments without split metadata
- includes purchases that do not automatically flow to seller settlement

Frontend note:
- Use this for an admin "Manual Settlement Audit" or "Company Account Payments" screen
- This is the best route for purchases that need manual review because they did not go through normal seller split settlement
- This route is broader than guest purchases; it covers any payment that was collected outside the seller split path

Typical response shape:

```json
{
  "statusCode": 200,
  "status": true,
  "message": "Manual settlement audit records retrieved successfully",
  "data": {
    "rows": [
      {
        "reference": "PSK_REF_123",
        "amount": 25000,
        "buyerEmail": "buyer@example.com",
        "storeId": 22,
        "storeName": "Seller Store",
        "settlementType": "company_account",
        "requiresManualSettlement": true
      }
    ]
  }
}
```

Practical difference between the two:
- `GET /order/guest/all` = guest customer purchases
- `GET /paystack/manual-settlement/audit` = any payment that did not flow to seller split settlement, whether guest or not

## Frontend Default Payloads

Update percentage:

```json
{
  "percentage_charge": 93.5,
  "dryRun": true
}
```

Sync new codes:

```json
{
  "dryRun": true,
  "perPage": 100
}
```

Resolve unmatched:

```json
{
  "dryRun": true,
  "classifications": ["missing_local_link"],
  "page": 1,
  "limit": 100
}
```

## Important UI Notes

- Seller share should be shown as `93.5%`
- Platform/company share should be shown as `6.5%`
- Paystack dashboard displays:
  - `Your share` = platform
  - `Subaccount gets` = seller
