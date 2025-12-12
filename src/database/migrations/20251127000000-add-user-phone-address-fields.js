// src/database/migrations/20251127000000-add-user-phone-address-fields.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check which columns already exist
    const table = await queryInterface.describeTable('users');

    // Add only the new fields that don't exist yet
    if (!table.companyAddress) {
      await queryInterface.addColumn('users', 'companyAddress', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }

    if (!table.companyPhone) {
      await queryInterface.addColumn('users', 'companyPhone', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    if (!table.driverAddress) {
      await queryInterface.addColumn('users', 'driverAddress', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }

    if (!table.driverPhone) {
      await queryInterface.addColumn('users', 'driverPhone', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
  },

  down: async (queryInterface) => {
    // Remove the columns
    const table = await queryInterface.describeTable('users');

    if (table.driverPhone) {
      await queryInterface.removeColumn('users', 'driverPhone');
    }
    if (table.driverAddress) {
      await queryInterface.removeColumn('users', 'driverAddress');
    }
    if (table.companyPhone) {
      await queryInterface.removeColumn('users', 'companyPhone');
    }
    if (table.companyAddress) {
      await queryInterface.removeColumn('users', 'companyAddress');
    }
  },
};
