"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("MAIL_LOG", {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      to: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      subject: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      provider: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      context: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      error: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      payload: {
        type: Sequelize.JSONB,
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

    await queryInterface.addIndex("MAIL_LOG", ["status", "createdAt"], {
      name: "idx_mail_log_status_createdAt",
    });
    await queryInterface.addIndex("MAIL_LOG", ["provider", "createdAt"], {
      name: "idx_mail_log_provider_createdAt",
    });
    await queryInterface.addIndex("MAIL_LOG", ["context", "createdAt"], {
      name: "idx_mail_log_context_createdAt",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex(
      "MAIL_LOG",
      "idx_mail_log_context_createdAt",
    );
    await queryInterface.removeIndex(
      "MAIL_LOG",
      "idx_mail_log_provider_createdAt",
    );
    await queryInterface.removeIndex(
      "MAIL_LOG",
      "idx_mail_log_status_createdAt",
    );
    await queryInterface.dropTable("MAIL_LOG");
  },
};
