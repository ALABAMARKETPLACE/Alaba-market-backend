"use strict";

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const tableInfo = await queryInterface.describeTable("USER");

      // Normalize string role values to the lower-case values used by app guards.
      if (tableInfo.role) {
        await queryInterface.sequelize.query(
          `
            UPDATE "USER"
            SET "role" = CASE
              WHEN LOWER(COALESCE("role", '')) IN ('admin', 'seller', 'user') THEN LOWER("role")
              WHEN "store_id" IS NOT NULL THEN 'seller'
              ELSE 'user'
            END
            WHERE "role" IS NULL
               OR "role" = ''
               OR "role" <> LOWER("role")
               OR "role" NOT IN ('admin', 'seller', 'user');
          `,
          { transaction },
        );
      }

      // Ensure JSONB roles array is present and valid.
      if (tableInfo.roles) {
        await queryInterface.sequelize.query(
          `
            UPDATE "USER"
            SET "roles" = CASE
              WHEN COALESCE("role", 'user') = 'admin' THEN '["admin"]'::jsonb
              WHEN COALESCE("role", 'user') = 'seller' OR "store_id" IS NOT NULL THEN '["seller"]'::jsonb
              ELSE '["user"]'::jsonb
            END
            WHERE "roles" IS NULL
               OR jsonb_typeof("roles") <> 'array'
               OR jsonb_array_length("roles") = 0;
          `,
          { transaction },
        );
      }

      // Ensure active_role is always populated with an allowed value.
      if (tableInfo.active_role) {
        await queryInterface.sequelize.query(
          `
            UPDATE "USER"
            SET "active_role" = CASE
              WHEN COALESCE("role", '') IN ('admin', 'seller', 'user') THEN COALESCE("role", 'user')
              WHEN "store_id" IS NOT NULL THEN 'seller'
              ELSE 'user'
            END
            WHERE "active_role" IS NULL
               OR "active_role" = ''
               OR "active_role" NOT IN ('admin', 'seller', 'user');
          `,
          { transaction },
        );
      }

      // Keep soft-delete and active flags in a usable state.
      if (tableInfo.is_active && tableInfo.status) {
        await queryInterface.sequelize.query(
          `
            UPDATE "USER"
            SET "is_active" = COALESCE("status", true)
            WHERE "is_active" IS NULL;
          `,
          { transaction },
        );
      }

      if (tableInfo.is_deleted) {
        await queryInterface.sequelize.query(
          `
            UPDATE "USER"
            SET "is_deleted" = false
            WHERE "is_deleted" IS NULL;
          `,
          { transaction },
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down() {
    // Data normalization migration; no destructive rollback.
  },
};
