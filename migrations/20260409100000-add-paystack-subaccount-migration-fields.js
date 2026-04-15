"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const tableName = "STORE";
      const tableInfo = await queryInterface.describeTable(tableName);

      if (!tableInfo.paystack_subaccount_code_old) {
        await queryInterface.addColumn(
          tableName,
          "paystack_subaccount_code_old",
          {
            type: Sequelize.STRING,
            allowNull: true,
          },
          { transaction },
        );
      }

      if (!tableInfo.paystack_subaccount_code_new) {
        await queryInterface.addColumn(
          tableName,
          "paystack_subaccount_code_new",
          {
            type: Sequelize.STRING,
            allowNull: true,
          },
          { transaction },
        );
      }

      if (!tableInfo.paystack_subaccount_migrated_at) {
        await queryInterface.addColumn(
          tableName,
          "paystack_subaccount_migrated_at",
          {
            type: Sequelize.DATE,
            allowNull: true,
          },
          { transaction },
        );
      }

      if (!tableInfo.paystack_subaccount_migration_status) {
        await queryInterface.addColumn(
          tableName,
          "paystack_subaccount_migration_status",
          {
            type: Sequelize.STRING(20),
            allowNull: true,
          },
          { transaction },
        );
      }

      if (!tableInfo.paystack_subaccount_migration_error) {
        await queryInterface.addColumn(
          tableName,
          "paystack_subaccount_migration_error",
          {
            type: Sequelize.TEXT,
            allowNull: true,
          },
          { transaction },
        );
      }

      await queryInterface.sequelize.query(
        `
          UPDATE "STORE"
          SET "paystack_subaccount_code_old" = COALESCE(
            "paystack_subaccount_code_old",
            "paystack_subaccount_code"
          )
          WHERE "paystack_subaccount_code" IS NOT NULL
            AND TRIM("paystack_subaccount_code") <> '';
        `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
          UPDATE "STORE"
          SET "paystack_subaccount_migration_status" = 'pending'
          WHERE "paystack_subaccount_migration_status" IS NULL
            AND "paystack_subaccount_code_old" IS NOT NULL
            AND TRIM("paystack_subaccount_code_old") <> '';
        `,
        { transaction },
      );

      await queryInterface.addIndex(
        tableName,
        ["paystack_subaccount_migration_status"],
        {
          name: "idx_store_paystack_subaccount_migration_status",
          transaction,
        },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.removeIndex(
        "STORE",
        "idx_store_paystack_subaccount_migration_status",
        { transaction },
      );
      await queryInterface.removeColumn(
        "STORE",
        "paystack_subaccount_migration_error",
        { transaction },
      );
      await queryInterface.removeColumn(
        "STORE",
        "paystack_subaccount_migration_status",
        { transaction },
      );
      await queryInterface.removeColumn(
        "STORE",
        "paystack_subaccount_migrated_at",
        { transaction },
      );
      await queryInterface.removeColumn(
        "STORE",
        "paystack_subaccount_code_new",
        { transaction },
      );
      await queryInterface.removeColumn(
        "STORE",
        "paystack_subaccount_code_old",
        { transaction },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
