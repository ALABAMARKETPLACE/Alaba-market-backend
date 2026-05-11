"use strict";

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const tableInfo = await queryInterface.describeTable("USER");

      if (!tableInfo.role || !tableInfo.type || !tableInfo.active_role) {
        await transaction.commit();
        return;
      }

      await queryInterface.sequelize.query(
        `
          WITH normalized AS (
            SELECT
              "_id" AS "user_id",
              CASE
                WHEN lower(COALESCE("active_role", '')) IN ('admin', 'seller', 'user', 'super_admin')
                  THEN lower("active_role")
                WHEN lower(COALESCE("active_role", '')) = 'customer' THEN 'user'
                WHEN lower(COALESCE("role", '')) IN ('admin', 'seller', 'user', 'super_admin')
                  THEN lower("role")
                WHEN lower(COALESCE("role", '')) = 'customer' THEN 'user'
                WHEN lower(COALESCE("type", '')) IN ('admin', 'seller', 'user', 'super_admin')
                  THEN lower("type")
                WHEN lower(COALESCE("type", '')) = 'customer' THEN 'user'
                WHEN COALESCE("roles", '[]'::jsonb) @> '["super_admin"]'::jsonb THEN 'super_admin'
                WHEN COALESCE("roles", '[]'::jsonb) @> '["admin"]'::jsonb THEN 'admin'
                WHEN COALESCE("roles", '[]'::jsonb) @> '["seller"]'::jsonb THEN 'seller'
                WHEN COALESCE("store_id", 0) IS NOT NULL THEN 'seller'
                ELSE 'user'
              END AS normalized_role
            FROM "USER"
          )
          UPDATE "USER" u
          SET
            "active_role" = n.normalized_role,
            "role" = n.normalized_role,
            "type" = n.normalized_role
          FROM normalized n
          WHERE
            u."_id" = n."user_id"
            AND (
              u."active_role" IS DISTINCT FROM n.normalized_role
              OR u."role" IS DISTINCT FROM n.normalized_role
              OR u."type" IS DISTINCT FROM n.normalized_role
            );
        `,
        { transaction },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down() {
    // Data migration intentionally does not have a down migration.
  },
};
