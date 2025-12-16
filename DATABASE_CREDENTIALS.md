# 🗄️ Database Credentials - Drivers & Companies

**Generated:** December 15, 2025  
**Database:** `alaba_marketplace` (PostgreSQL)

---

## 📦 ALL DRIVERS IN DATABASE

**Total Drivers:** 6

### Driver 1 - promise Sylva

- **Driver ID:** e43cf6e8-9637-460b-aa54-4f660e91d328
- **Name:** promise Sylva
- **Email:** sylvapromise5@gmail.com
- **Password (Hashed):** `$2b$10$JSWVYysQVA/mkDSvoyJ4zOyhHjCwmp5fdbmcJpAoEjvJwSUlhNxjC`
- **Phone:** (empty)
- **License Number:** N/A
- **Vehicle Number:** N/A
- **Company:** Unassigned
- **Status:** ✅ Active
- **Created:** 2025-12-15T17:17:19.558Z

### Driver 2 - Driver 1 (FastMove Logistics)

- **Driver ID:** fe57e410-2337-42da-8604-240b7145e563
- **Name:** Driver 1
- **Email:** driver1@example.com
- **Password (Hashed):** `$2b$10$L..finBgbScJw90wZJO1ju6vA9xRDGstYp7cIS3B.4Q.uiRTLzpLS`
- **Phone:** 08011112001
- **License Number:** DL100001
- **Vehicle Number:** VH100001
- **Company:** FastMove Logistics
- **Status:** ✅ Active
- **Created:** 2025-12-15T16:57:30.549Z

### Driver 3 - Driver 2 (FastMove Logistics)

- **Driver ID:** ac8f72ed-020a-4f05-ae46-136e2f13587f
- **Name:** Driver 2
- **Email:** driver2@example.com
- **Password (Hashed):** `$2b$10$L..finBgbScJw90wZJO1ju6vA9xRDGstYp7cIS3B.4Q.uiRTLzpLS`
- **Phone:** 08011112002
- **License Number:** DL100002
- **Vehicle Number:** VH100002
- **Company:** FastMove Logistics
- **Status:** ✅ Active
- **Created:** 2025-12-15T16:57:30.549Z

### Driver 4 - Driver 3 (FastMove Logistics)

- **Driver ID:** d2bb0ce7-bc30-4bd4-ad9a-ddc263f84933
- **Name:** Driver 3
- **Email:** driver3@example.com
- **Password (Hashed):** `$2b$10$L..finBgbScJw90wZJO1ju6vA9xRDGstYp7cIS3B.4Q.uiRTLzpLS`
- **Phone:** 08011112003
- **License Number:** DL100003
- **Vehicle Number:** VH100003
- **Company:** FastMove Logistics
- **Status:** ✅ Active
- **Created:** 2025-12-15T16:57:30.549Z

### Driver 5 - Driver 4 (FastMove Logistics)

- **Driver ID:** 9c083250-911d-4e1c-a7fe-fb9a99fcd8cb
- **Name:** Driver 4
- **Email:** driver4@example.com
- **Password:** No user account (driver-only record)
- **Phone:** 08011112004
- **License Number:** DL100004
- **Vehicle Number:** VH100004
- **Company:** FastMove Logistics
- **Status:** ✅ Active
- **Created:** 2025-12-15T16:57:30.549Z

### Driver 6 - Driver 5 (FastMove Logistics)

- **Driver ID:** edd20ec8-e1ce-4999-9453-9c1a19da61d1
- **Name:** Driver 5
- **Email:** driver5@example.com
- **Password:** No user account (driver-only record)
- **Phone:** 08011112005
- **License Number:** DL100005
- **Vehicle Number:** VH100005
- **Company:** FastMove Logistics
- **Status:** ✅ Active
- **Created:** 2025-12-15T16:57:30.549Z

---

## 🏢 ALL COMPANIES IN DATABASE

**Total Companies:** 1

### Company 1 - FastMove Logistics

- **Company ID:** d5ecb2ad-3fc8-4bf1-84cc-90cec7c8c18a
- **Company Name:** FastMove Logistics
- **Admin Email:** deliveryowner@example.com
- **Admin Password (Hashed):** `$2b$10$L..finBgbScJw90wZJO1ju6vA9xRDGstYp7cIS3B.4Q.uiRTLzpLS`
- **Admin Name:** Delivery Owner
- **Admin Phone:** 08055555555
- **Number of Drivers:** 5
- **Subscription Status:** active
- **Status:** ✅ Active
- **Created:** 2025-12-15T16:57:30.536Z

---

## 🔐 IMPORTANT SECURITY NOTES

⚠️ **WARNING:** All passwords are **bcrypt hashed** (cost factor: $2b$10$). These are not plain text passwords.

### Hash Details:

- **Algorithm:** bcrypt
- **Cost Factor:** 10 ($2b$10$)
- **Format:** $2b$10$[salt(22 chars)][hash(31 chars)]

### Notable Observations:

1. **Drivers 1, 2, 3** have the same password hash:
   - `$2b$10$L..finBgbScJw90wZJO1ju6vA9xRDGstYp7cIS3B.4Q.uiRTLzpLS`
   - This hash is shared with **Company Admin** (Delivery Owner)
   - **This is likely a test/demo password used for multiple accounts**

2. **Driver "promise Sylva"** has a different hash:
   - `$2b$10$JSWVYysQVA/mkDSvoyJ4zOyhHjCwmp5fdbmcJpAoEjvJwSUlhNxjC`

3. **Drivers 4 & 5** have no user accounts:
   - Only driver records exist without corresponding user authentication
   - These appear to be driver-only profiles without login capability

4. **One Unassigned Driver:**
   - Driver "promise Sylva" has no company assignment
   - Status is still Active

---

## 📊 SUMMARY

| Metric                            | Count    |
| --------------------------------- | -------- |
| **Total Drivers**                 | 6        |
| **Total Companies**               | 1        |
| **Active Drivers**                | 6 (100%) |
| **Active Companies**              | 1 (100%) |
| **Drivers with User Accounts**    | 4        |
| **Drivers without User Accounts** | 2        |
| **Unassigned Drivers**            | 1        |
| **Assigned Drivers**              | 5        |

---

## 💾 JSON Export Files

The complete data has been exported to:

- `./exports/drivers.json` - All driver records with full details
- `./exports/companies.json` - All company records with admin credentials

---

## 🔄 How to Regenerate This Report

Run the export script from the backend:

```bash
cd /Users/macbook/Desktop/delivery-app/new-alaba-marketplace
npx ts-node scripts/query-credentials.ts
```

This will:

1. Connect to PostgreSQL database `alaba_marketplace`
2. Query all drivers and their associated users
3. Query all companies and their admin users
4. Display formatted tables in terminal
5. Export JSON files to `./exports/` directory

---

**Last Updated:** December 15, 2025, 6:05 PM
