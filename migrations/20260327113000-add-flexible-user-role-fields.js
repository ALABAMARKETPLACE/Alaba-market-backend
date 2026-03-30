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
            allowNull: false,
            defaultValue: ["user"],
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
            allowNull: false,
            defaultValue: "user",
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

      await queryInterface.sequelize.query(
        `
          UPDATE "USER"
          SET "roles" = CASE
            WHEN "role" = 'admin' THEN '["admin"]'::jsonb
            WHEN "role" = 'seller' THEN '["user", "seller"]'::jsonb
            ELSE '["user"]'::jsonb
          END
          WHERE "roles" IS NULL
             OR jsonb_typeof("roles") <> 'array';
        `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
          UPDATE "USER"
          SET "active_role" = CASE
            WHEN "role" IN ('admin', 'seller', 'user') THEN "role"
            WHEN "type" = 'seller' AND "store_id" IS NOT NULL THEN 'user'
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

      await queryInterface.sequelize.query(
        `
          UPDATE "USER"
          SET "role" = COALESCE("active_role", "role", 'user');
        `,
        { transaction },
      );

      await queryInterface.addIndex("USER", ["active_role"], {
        name: "idx_user_active_role",
        transaction,
      });
      await queryInterface.addIndex("USER", ["is_active"], {
        name: "idx_user_is_active",
        transaction,
      });
      await queryInterface.addIndex("USER", ["is_deleted"], {
        name: "idx_user_is_deleted",
        transaction,
      });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.removeIndex("USER", "idx_user_is_deleted", {
        transaction,
      });
      await queryInterface.removeIndex("USER", "idx_user_is_active", {
        transaction,
      });
      await queryInterface.removeIndex("USER", "idx_user_active_role", {
        transaction,
      });

      await queryInterface.removeColumn("USER", "deleted_at", { transaction });
      await queryInterface.removeColumn("USER", "disabled_at", { transaction });
      await queryInterface.removeColumn("USER", "is_deleted", { transaction });
      await queryInterface.removeColumn("USER", "is_active", { transaction });
      await queryInterface.removeColumn("USER", "active_role", { transaction });
      await queryInterface.removeColumn("USER", "roles", { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
