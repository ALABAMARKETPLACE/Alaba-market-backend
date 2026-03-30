"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const tableInfo = await queryInterface.describeTable("USER");

      if (!tableInfo.admin_invited_at) {
        await queryInterface.addColumn(
          "USER",
          "admin_invited_at",
          {
            type: Sequelize.DATE,
            allowNull: true,
          },
          { transaction },
        );
      }

      if (!tableInfo.admin_invited_by) {
        await queryInterface.addColumn(
          "USER",
          "admin_invited_by",
          {
            type: Sequelize.INTEGER,
            allowNull: true,
          },
          { transaction },
        );
      }

      if (!tableInfo.admin_invite_accepted_at) {
        await queryInterface.addColumn(
          "USER",
          "admin_invite_accepted_at",
          {
            type: Sequelize.DATE,
            allowNull: true,
          },
          { transaction },
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.removeColumn("USER", "admin_invite_accepted_at", {
        transaction,
      });
      await queryInterface.removeColumn("USER", "admin_invited_by", {
        transaction,
      });
      await queryInterface.removeColumn("USER", "admin_invited_at", {
        transaction,
      });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
