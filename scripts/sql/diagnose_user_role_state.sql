-- Diagnose role/visibility state in USER table.
-- Run before and after migrations to confirm data normalization effects.

-- 1) Overall totals
SELECT
  COUNT(*) AS total_users,
  COUNT(*) FILTER (WHERE "is_active" = true) AS active_users,
  COUNT(*) FILTER (WHERE COALESCE("is_deleted", false) = false) AS not_deleted_users,
  COUNT(*) FILTER (
    WHERE "is_active" = true AND COALESCE("is_deleted", false) = false
  ) AS active_and_not_deleted_users
FROM "USER";

-- 2) Role distributions (raw role + active_role)
SELECT
  COALESCE("role", '<NULL>') AS role,
  COALESCE("active_role", '<NULL>') AS active_role,
  COUNT(*) AS users
FROM "USER"
GROUP BY COALESCE("role", '<NULL>'), COALESCE("active_role", '<NULL>')
ORDER BY users DESC, role, active_role;

-- 3) Invalid role strings likely to break role-based filtering
SELECT
  _id,
  email,
  "role",
  "active_role",
  "store_id",
  "is_active",
  "is_deleted"
FROM "USER"
WHERE COALESCE("role", '') NOT IN ('admin', 'seller', 'user')
   OR COALESCE("active_role", '') NOT IN ('admin', 'seller', 'user')
ORDER BY _id
LIMIT 200;

-- 4) NULL/empty role fields
SELECT
  COUNT(*) FILTER (WHERE "role" IS NULL OR "role" = '') AS null_or_empty_role,
  COUNT(*) FILTER (WHERE "active_role" IS NULL OR "active_role" = '') AS null_or_empty_active_role,
  COUNT(*) FILTER (WHERE "roles" IS NULL) AS null_roles_jsonb,
  COUNT(*) FILTER (
    WHERE "roles" IS NOT NULL AND jsonb_typeof("roles") <> 'array'
  ) AS non_array_roles_jsonb,
  COUNT(*) FILTER (
    WHERE "roles" IS NOT NULL
      AND jsonb_typeof("roles") = 'array'
      AND jsonb_array_length("roles") = 0
  ) AS empty_roles_array
FROM "USER";

-- 5) Store-linked users with non-seller role (often visibility mismatch)
SELECT
  COUNT(*) AS store_users_not_seller
FROM "USER"
WHERE "store_id" IS NOT NULL
  AND COALESCE("role", '') <> 'seller';

-- 6) Snapshot of potentially mismatched users
SELECT
  _id,
  email,
  "role",
  "active_role",
  "roles",
  "store_id",
  "status",
  "is_active",
  "is_deleted"
FROM "USER"
WHERE ("store_id" IS NOT NULL AND COALESCE("role", '') <> 'seller')
   OR COALESCE("role", '') NOT IN ('admin', 'seller', 'user')
   OR COALESCE("active_role", '') NOT IN ('admin', 'seller', 'user')
ORDER BY _id
LIMIT 200;
