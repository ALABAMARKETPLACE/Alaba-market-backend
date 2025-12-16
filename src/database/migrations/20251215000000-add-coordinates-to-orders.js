'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('orders', 'deliveryLatitude', {
      type: Sequelize.FLOAT,
      allowNull: true,
      defaultValue: null,
    });

    await queryInterface.addColumn('orders', 'deliveryLongitude', {
      type: Sequelize.FLOAT,
      allowNull: true,
      defaultValue: null,
    });

    await queryInterface.addColumn('orders', 'originLatitude', {
      type: Sequelize.FLOAT,
      allowNull: true,
      defaultValue: null,
    });

    await queryInterface.addColumn('orders', 'originLongitude', {
      type: Sequelize.FLOAT,
      allowNull: true,
      defaultValue: null,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('orders', 'deliveryLatitude');
    await queryInterface.removeColumn('orders', 'deliveryLongitude');
    await queryInterface.removeColumn('orders', 'originLatitude');
    await queryInterface.removeColumn('orders', 'originLongitude');
  },
};
