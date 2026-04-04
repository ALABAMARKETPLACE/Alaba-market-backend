"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      const tableInfo = await queryInterface.describeTable("USER");

      if (!tableInfo.roles) {
        await queryInterface.addColumn("USER", "roles", {
          type: Sequelize.JSONB,
          allowNull: false,
          defaultValue: ["user"],
        });
      }

      if (!tableInfo.active_role) {
        await queryInterface.addColumn("USER", "active_role", {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: "user",
        });
      }

      if (!tableInfo.is_active) {
        await queryInterface.addColumn("USER", "is_active", {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        });
      }

      if (!tableInfo.is_deleted) {
        await queryInterface.addColumn("USER", "is_deleted", {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        });
      }

      if (!tableInfo.disabled_at) {
        await queryInterface.addColumn("USER", "disabled_at", {
          type: Sequelize.DATE,
          allowNull: true,
        });
      }

      if (!tableInfo.deleted_at) {
        await queryInterface.addColumn("USER", "deleted_at", {
          type: Sequelize.DATE,
          allowNull: true,
        });
      }

      // Backfill role only if missing
      await queryInterface.sequelize.query(
        `
          UPDATE "USER"
          SET "role" = CASE
            WHEN "store_id" IS NOT NULL THEN 'seller'
            ELSE 'user'
          END
          WHERE "role" IS NULL
             OR "role" = '';
        `,
      );

      // Backfill roles only if missing
      await queryInterface.sequelize.query(
        `
          UPDATE "USER"
          SET "roles" = CASE
            WHEN "role" = 'admin' THEN '["admin"]'::jsonb
            WHEN "role" = 'seller' OR ("type" = 'seller' AND "store_id" IS NOT NULL) THEN '["seller"]'::jsonb
            ELSE '["user"]'::jsonb
          END
          WHERE "roles" IS NULL;
        `,
      );

      // Backfill active_role only if missing
      await queryInterface.sequelize.query(
        `
          UPDATE "USER"
          SET "active_role" = CASE
            WHEN "role" IN ('admin', 'seller', 'user') THEN "role"
            WHEN "type" = 'seller' AND "store_id" IS NOT NULL THEN 'seller'
            ELSE 'user'
          END
          WHERE "active_role" IS NULL
             OR "active_role" = '';
        `,
      );

      await queryInterface.sequelize.query(
        `
          UPDATE "USER"
          SET "is_active" = COALESCE("status", true)
          WHERE "is_active" IS NULL;
        `,
      );

      await queryInterface.sequelize.query(
        `
          UPDATE "USER"
          SET "is_deleted" = false
          WHERE "is_deleted" IS NULL;
        `,
      );

      // Do NOT sync active_role back into role
      // That line is what causes destructive overwrite

      const indexes = await queryInterface.showIndex("USER");

      const hasActiveRoleIndex = indexes.some(
        (idx) => idx.name === "idx_user_active_role",
      );
      const hasIsActiveIndex = indexes.some(
        (idx) => idx.name === "idx_user_is_active",
      );
      const hasIsDeletedIndex = indexes.some(
        (idx) => idx.name === "idx_user_is_deleted",
      );

      if (!hasActiveRoleIndex) {
        await queryInterface.addIndex("USER", ["active_role"], {
          name: "idx_user_active_role",
        });
      }

      if (!hasIsActiveIndex) {
        await queryInterface.addIndex("USER", ["is_active"], {
          name: "idx_user_is_active",
        });
      }

      if (!hasIsDeletedIndex) {
        await queryInterface.addIndex("USER", ["is_deleted"], {
          name: "idx_user_is_deleted",
        });
      }
    } catch (error) {
      throw error;
    }
  },

  async down(queryInterface) {
    try {
      const indexes = await queryInterface.showIndex("USER");

      if (indexes.some((idx) => idx.name === "idx_user_is_deleted")) {
        await queryInterface.removeIndex("USER", "idx_user_is_deleted");
      }

      if (indexes.some((idx) => idx.name === "idx_user_is_active")) {
        await queryInterface.removeIndex("USER", "idx_user_is_active");
      }

      if (indexes.some((idx) => idx.name === "idx_user_active_role")) {
        await queryInterface.removeIndex("USER", "idx_user_active_role");
      }

      const tableInfo = await queryInterface.describeTable("USER");

      if (tableInfo.deleted_at) {
        await queryInterface.removeColumn("USER", "deleted_at");
      }

      if (tableInfo.disabled_at) {
        await queryInterface.removeColumn("USER", "disabled_at");
      }

      if (tableInfo.is_deleted) {
        await queryInterface.removeColumn("USER", "is_deleted");
      }

      if (tableInfo.is_active) {
        await queryInterface.removeColumn("USER", "is_active");
      }

      if (tableInfo.active_role) {
        await queryInterface.removeColumn("USER", "active_role");
      }

      if (tableInfo.roles) {
        await queryInterface.removeColumn("USER", "roles");
      }
    } catch (error) {
      throw error;
    }
  },
};
