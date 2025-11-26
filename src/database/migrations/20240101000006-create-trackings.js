'use strict';

// src/database/migrations/20240101000006-create-trackings.js

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('trackings', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      orderId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'orders', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      riderId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'drivers', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      status: {
        type: Sequelize.ENUM('pending', 'picked_up', 'in_transit', 'delivered', 'cancelled'),
        defaultValue: 'pending',
      },
      latitude: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: true,
      },
      longitude: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: true,
      },
      address: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      estimatedDeliveryTime: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      actualDeliveryTime: {
        type: Sequelize.DATE,
        allowNull: true,
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

    await queryInterface.addIndex('trackings', ['orderId']);
    await queryInterface.addIndex('trackings', ['riderId']);
    await queryInterface.addIndex('trackings', ['status']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('trackings');
  },
};
