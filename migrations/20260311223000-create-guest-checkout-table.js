"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("GUEST_CHECKOUT", {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      reference: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      guest_email: {
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
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("GUEST_CHECKOUT");
  },
};
