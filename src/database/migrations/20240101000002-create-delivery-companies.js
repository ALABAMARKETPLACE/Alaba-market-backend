// src/database/migrations/20240101000002-create-delivery-companies.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('delivery_companies', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      companyName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      routes: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      logo: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      documents: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      registrationNumber: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      subscriptionStatus: {
        type: Sequelize.ENUM('active', 'inactive', 'expired', 'free_trial'),
        defaultValue: 'free_trial',
      },
      subscriptionExpiresAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      freeTrialEndsAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('delivery_companies', ['userId']);
    await queryInterface.addIndex('delivery_companies', ['subscriptionStatus']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('delivery_companies');
  },
};
