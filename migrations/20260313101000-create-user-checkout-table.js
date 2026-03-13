"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("USER_CHECKOUT", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT,
      },
      reference: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      user_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      user_email: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      amount_kobo: {
        type: Sequelize.BIGINT,
        allowNull: false,
        defaultValue: 0,
      },
      payload: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "initialized",
      },
      payment_status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "pending",
      },
      order_ids: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      webhook_payload: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      error: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      processed_at: {
        type: Sequelize.DATE,
        allowNull: true,
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

    await queryInterface.addIndex("USER_CHECKOUT", ["user_id"], {
      name: "idx_user_checkout_user_id",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("USER_CHECKOUT", "idx_user_checkout_user_id");
    await queryInterface.dropTable("USER_CHECKOUT");
  },
};
