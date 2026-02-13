"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Add is_multi_seller flag
      await queryInterface.addColumn(
        "ORDER",
        "is_multi_seller",
        {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          allowNull: false,
          comment: "True if order is part of a multi-seller checkout",
        },
        { transaction },
      );

      // Add index for finding related multi-seller orders
      await queryInterface.addIndex("ORDER", ["payment_reference"], {
        name: "idx_orders_payment_reference",
        transaction,
      });

      await queryInterface.addIndex("ORDER", ["is_multi_seller"], {
        name: "idx_orders_is_multi_seller",
        transaction,
      });

      await transaction.commit();
      console.log("✅ Multi-seller fields added successfully");
    } catch (error) {
      await transaction.rollback();
      console.error("❌ Migration failed:", error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.removeIndex(
        "ORDER",
        "idx_orders_payment_reference",
        { transaction },
      );
      await queryInterface.removeIndex("ORDER", "idx_orders_is_multi_seller", {
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
