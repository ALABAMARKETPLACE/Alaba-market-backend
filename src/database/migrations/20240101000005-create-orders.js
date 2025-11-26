// src/database/migrations/20240101000005-create-orders.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('orders', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      buyerId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
      },
      sellerId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
      },
      productId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'products', key: 'id' },
      },
      deliveryCompanyId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'delivery_companies', key: 'id' },
      },
      driverId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'drivers', key: 'id' },
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      unitPrice: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      totalPrice: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      deliveryFee: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
      },
      status: {
        type: Sequelize.ENUM('pending', 'payment_confirmed', 'assigned', 'package_received', 'picked_up', 'out_for_delivery', 'delivered', 'failed', 'cancelled'),
        defaultValue: 'pending',
      },
      paymentStatus: {
        type: Sequelize.ENUM('pending', 'success', 'failed'),
        defaultValue: 'pending',
      },
      paystackReference: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      barcodeShortCode: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false,
      },
      deliveryCode: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false,
      },
      selectedRoute: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      deliveryAddress: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      deliveryCity: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      deliveryState: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      trackingHistory: {
        type: Sequelize.JSONB,
        defaultValue: [],
      },
      deliveredAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      assignedAt: {
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

    await queryInterface.addIndex('orders', ['buyerId']);
    await queryInterface.addIndex('orders', ['sellerId']);
    await queryInterface.addIndex('orders', ['status']);
    await queryInterface.addIndex('orders', ['barcodeShortCode']);
    await queryInterface.addIndex('orders', ['deliveryCode']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('orders');
  },
};
