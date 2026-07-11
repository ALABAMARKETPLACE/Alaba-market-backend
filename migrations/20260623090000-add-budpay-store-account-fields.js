"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    const tableName = "STORE";

    try {
      const tableInfo = await queryInterface.describeTable(tableName);
      const columns = {
        budpay_subaccount_id: { type: Sequelize.BIGINT, allowNull: true },
        budpay_subaccount_code: { type: Sequelize.STRING, allowNull: true },
        budpay_customer_id: { type: Sequelize.BIGINT, allowNull: true },
        budpay_virtual_account_id: { type: Sequelize.BIGINT, allowNull: true },
        budpay_account_number: {
          type: Sequelize.STRING(50),
          allowNull: true,
        },
        budpay_bank_name: { type: Sequelize.STRING, allowNull: true },
        budpay_import_status: {
          type: Sequelize.STRING(20),
          allowNull: false,
          defaultValue: "pending",
        },
        budpay_import_error: { type: Sequelize.TEXT, allowNull: true },
        budpay_imported_at: { type: Sequelize.DATE, allowNull: true },
        budpay_raw_response: { type: Sequelize.JSONB, allowNull: true },
      };

      for (const [name, definition] of Object.entries(columns)) {
        if (!tableInfo[name]) {
          await queryInterface.addColumn(tableName, name, definition, {
            transaction,
          });
        }
      }

      await queryInterface.addIndex(
        tableName,
        ["budpay_import_status"],
        {
          name: "idx_store_budpay_import_status",
          transaction,
        },
      );
      await queryInterface.addIndex(
        tableName,
        ["budpay_customer_id"],
        {
          name: "idx_store_budpay_customer_id",
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
    const tableName = "STORE";
    const columns = [
      "budpay_raw_response",
      "budpay_imported_at",
      "budpay_import_error",
      "budpay_import_status",
      "budpay_bank_name",
      "budpay_account_number",
      "budpay_virtual_account_id",
      "budpay_customer_id",
      "budpay_subaccount_code",
      "budpay_subaccount_id",
    ];

    try {
      await queryInterface.removeIndex(
        tableName,
        "idx_store_budpay_customer_id",
        { transaction },
      );
      await queryInterface.removeIndex(
        tableName,
        "idx_store_budpay_import_status",
        { transaction },
      );
      for (const column of columns) {
        await queryInterface.removeColumn(tableName, column, { transaction });
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
