"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const tableInfo = await queryInterface.describeTable("ORDER", {
        transaction,
      });
      const indexes = await queryInterface.showIndex("ORDER", { transaction });
      const hasIndex = (name) => indexes.some((index) => index.name === name);

      if (!tableInfo.is_multi_seller) {
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
      }

      if (tableInfo.payment_reference && !hasIndex("idx_orders_payment_reference")) {
        await queryInterface.addIndex("ORDER", ["payment_reference"], {
          name: "idx_orders_payment_reference",
          transaction,
        });
      }

      if (!hasIndex("idx_orders_is_multi_seller")) {
        await queryInterface.addIndex("ORDER", ["is_multi_seller"], {
          name: "idx_orders_is_multi_seller",
          transaction,
        });
      }

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
      const tableInfo = await queryInterface.describeTable("ORDER", {
        transaction,
      });
      const indexes = await queryInterface.showIndex("ORDER", { transaction });
      const hasIndex = (name) => indexes.some((index) => index.name === name);

      if (hasIndex("idx_orders_payment_reference")) {
        await queryInterface.removeIndex(
          "ORDER",
          "idx_orders_payment_reference",
          { transaction },
        );
      }

      if (hasIndex("idx_orders_is_multi_seller")) {
        await queryInterface.removeIndex("ORDER", "idx_orders_is_multi_seller", {
          transaction,
        });
      }

      if (tableInfo.is_multi_seller) {
        await queryInterface.removeColumn("ORDER", "is_multi_seller", {
          transaction,
        });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
