"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("PAYMENT_SPLITS", {
      id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      order_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      store_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      total_amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      admin_amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      seller_amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      admin_percentage: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 5.0,
      },
      seller_percentage: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 95.0,
      },
      paystack_transaction_id: {
        type: Sequelize.STRING,
      },
      paystack_split_response: {
        type: Sequelize.JSON,
      },
      split_status: {
        type: Sequelize.STRING(50),
        defaultValue: "pending",
      },
      admin_settled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      seller_settled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      admin_settled_at: {
        type: Sequelize.DATE,
      },
      seller_settled_at: {
        type: Sequelize.DATE,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    //Explicit, stable index names
    await queryInterface.addIndex(
      "PAYMENT_SPLITS",
      ["order_id"],
      { name: "idx_payment_splits_order_id" }
    );

    await queryInterface.addIndex(
      "PAYMENT_SPLITS",
      ["store_id"],
      { name: "idx_payment_splits_store_id" }
    );

    await queryInterface.addIndex(
      "PAYMENT_SPLITS",
      ["split_status"],
      { name: "idx_payment_splits_split_status" }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("PAYMENT_SPLITS");
  },
};