"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // ✅ Allow storeId to be null for admin banners
    await queryInterface.changeColumn("BANNER", "storeId", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // ✅ Revert back to not allowing null (if you need to rollback)
    await queryInterface.changeColumn("BANNER", "storeId", {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
  },
};
