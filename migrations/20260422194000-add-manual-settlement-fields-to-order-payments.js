"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const tableName = "ORDER_PAYMENTS";
      const tableInfo = await queryInterface.describeTable(tableName);

      if (!tableInfo.requires_manual_settlement) {
        await queryInterface.addColumn(
          tableName,
          "requires_manual_settlement",
          {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          },
          { transaction },
        );
      }

      if (!tableInfo.collection_mode) {
        await queryInterface.addColumn(
          tableName,
          "collection_mode",
          {
            type: Sequelize.STRING,
            allowNull: true,
          },
          { transaction },
        );
      }

      if (!tableInfo.paystack_account_used) {
        await queryInterface.addColumn(
          tableName,
          "paystack_account_used",
          {
            type: Sequelize.STRING,
            allowNull: true,
          },
          { transaction },
        );
      }

      if (!tableInfo.manual_settlement_reason) {
        await queryInterface.addColumn(
          tableName,
          "manual_settlement_reason",
          {
            type: Sequelize.STRING,
            allowNull: true,
          },
          { transaction },
        );
      }

      await queryInterface.addIndex(
        tableName,
        ["requires_manual_settlement", "status"],
        {
          name: "idx_order_payments_manual_settlement_status",
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
        "ORDER_PAYMENTS",
        "idx_order_payments_manual_settlement_status",
        { transaction },
      );
      await queryInterface.removeColumn(
        "ORDER_PAYMENTS",
        "manual_settlement_reason",
        { transaction },
      );
      await queryInterface.removeColumn(
        "ORDER_PAYMENTS",
        "paystack_account_used",
        { transaction },
      );
      await queryInterface.removeColumn(
        "ORDER_PAYMENTS",
        "collection_mode",
        { transaction },
      );
      await queryInterface.removeColumn(
        "ORDER_PAYMENTS",
        "requires_manual_settlement",
        { transaction },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
