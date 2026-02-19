// migrations/20260213145016-add-multi-seller-fields.js

"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Check if column exists before adding
      const tableInfo = await queryInterface.describeTable("ORDER");

      // Add is_multi_seller if it doesn't exist
      if (!tableInfo.is_multi_seller) {
        await queryInterface.addColumn(
          "ORDER",
          "is_multi_seller",
          {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: "True if order is part of a multi-seller checkout",
          },
          { transaction },
        );
      }

      // Add payment_reference if it doesn't exist
      if (!tableInfo.payment_reference) {
        await queryInterface.addColumn(
          "ORDER",
          "payment_reference",
          {
            type: Sequelize.STRING,
            allowNull: true,
            comment: "Shared payment reference for multi-seller orders",
          },
          { transaction },
        );
      }

      // Add index on payment_reference if column was added
      if (!tableInfo.payment_reference) {
        await queryInterface.addIndex("ORDER", ["payment_reference"], {
          name: "idx_order_payment_reference",
          transaction,
        });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Remove index
      await queryInterface.removeIndex("ORDER", "idx_order_payment_reference", {
        transaction,
      });

      // Remove columns
      await queryInterface.removeColumn("ORDER", "payment_reference", {
        transaction,
      });
      await queryInterface.removeColumn("ORDER", "is_multi_seller", {
        transaction,
      });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
