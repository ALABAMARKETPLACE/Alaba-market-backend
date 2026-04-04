"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const tableInfo = await queryInterface.describeTable("USER");

      if (!tableInfo.roles) {
        await queryInterface.addColumn(
          "USER",
          "roles",
          {
            type: Sequelize.JSONB,
            allowNull: true,
            defaultValue: null,
          },
          { transaction },
        );
      }

      if (!tableInfo.active_role) {
        await queryInterface.addColumn(
          "USER",
          "active_role",
          {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue: null,
          },
          { transaction },
        );
      }

      if (!tableInfo.is_active) {
        await queryInterface.addColumn(
          "USER",
          "is_active",
          {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true,
          },
          { transaction },
        );
      }

      if (!tableInfo.is_deleted) {
        await queryInterface.addColumn(
          "USER",
          "is_deleted",
          {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          },
          { transaction },
        );
      }

      if (!tableInfo.disabled_at) {
        await queryInterface.addColumn(
          "USER",
          "disabled_at",
          {
            type: Sequelize.DATE,
            allowNull: true,
          },
          { transaction },
        );
      }

      if (!tableInfo.deleted_at) {
        await queryInterface.addColumn(
          "USER",
          "deleted_at",
          {
            type: Sequelize.DATE,
            allowNull: true,
          },
          { transaction },
        );
      }

      // Backfill role only if missing
      await queryInterface.sequelize.query(
        `
          UPDATE "USER"
          SET "role" = CASE
            WHEN "role" = 'Seller' OR  "store_id" IS NOT NULL THEN '["seller"]'::jsonb
            ELSE 'user'::jsonb
          END
        `,
        { transaction },
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
        { transaction },
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
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
          UPDATE "USER"
          SET "is_active" = COALESCE("status", true)
          WHERE "is_active" IS NULL;
        `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
          UPDATE "USER"
          SET "is_deleted" = false
          WHERE "is_deleted" IS NULL;
        `,
        { transaction },
      );

      // Do NOT sync active_role back into role
      // That line is what causes destructive overwrite

      await queryInterface.changeColumn(
        "USER",
        "roles",
        {
          type: Sequelize.JSONB,
          allowNull: false,
          defaultValue: ["user"],
        },
        { transaction },
      );

      await queryInterface.changeColumn(
        "USER",
        "active_role",
        {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: "user",
        },
        { transaction },
      );

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
          transaction,
        });
      }

      if (!hasIsActiveIndex) {
        await queryInterface.addIndex("USER", ["is_active"], {
          name: "idx_user_is_active",
          transaction,
        });
      }

      if (!hasIsDeletedIndex) {
        await queryInterface.addIndex("USER", ["is_deleted"], {
          name: "idx_user_is_deleted",
          transaction,
        });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const indexes = await queryInterface.showIndex("USER");

      if (indexes.some((idx) => idx.name === "idx_user_is_deleted")) {
        await queryInterface.removeIndex("USER", "idx_user_is_deleted", {
          transaction,
        });
      }

      if (indexes.some((idx) => idx.name === "idx_user_is_active")) {
        await queryInterface.removeIndex("USER", "idx_user_is_active", {
          transaction,
        });
      }

      if (indexes.some((idx) => idx.name === "idx_user_active_role")) {
        await queryInterface.removeIndex("USER", "idx_user_active_role", {
          transaction,
        });
      }

      const tableInfo = await queryInterface.describeTable("USER");

      if (tableInfo.deleted_at) {
        await queryInterface.removeColumn("USER", "deleted_at", { transaction });
      }

      if (tableInfo.disabled_at) {
        await queryInterface.removeColumn("USER", "disabled_at", { transaction });
      }

      if (tableInfo.is_deleted) {
        await queryInterface.removeColumn("USER", "is_deleted", { transaction });
      }

      if (tableInfo.is_active) {
        await queryInterface.removeColumn("USER", "is_active", { transaction });
      }

      if (tableInfo.active_role) {
        await queryInterface.removeColumn("USER", "active_role", { transaction });
      }

      if (tableInfo.roles) {
        await queryInterface.removeColumn("USER", "roles", { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};