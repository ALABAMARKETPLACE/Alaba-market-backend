"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("PAYSTACK_WEBHOOK_EVENTS", {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      event_key: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      event: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      reference: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      paystack_transaction_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "processing",
      },
      attempts: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      payload: {
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

    await queryInterface.addIndex("PAYSTACK_WEBHOOK_EVENTS", ["reference"], {
      name: "idx_paystack_webhook_events_reference",
    });
    await queryInterface.addIndex("PAYSTACK_WEBHOOK_EVENTS", ["status"], {
      name: "idx_paystack_webhook_events_status",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex(
      "PAYSTACK_WEBHOOK_EVENTS",
      "idx_paystack_webhook_events_status",
    );
    await queryInterface.removeIndex(
      "PAYSTACK_WEBHOOK_EVENTS",
      "idx_paystack_webhook_events_reference",
    );
    await queryInterface.dropTable("PAYSTACK_WEBHOOK_EVENTS");
  },
};
