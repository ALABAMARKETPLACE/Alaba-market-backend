"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const tableInfo = await queryInterface.describeTable("USER", {
        transaction,
      });

      if (!tableInfo.password_reset_token_hash) {
        await queryInterface.addColumn(
          "USER",
          "password_reset_token_hash",
          {
            type: Sequelize.STRING,
            allowNull: true,
          },
          { transaction },
        );
      }

      if (!tableInfo.password_reset_expires_at) {
        await queryInterface.addColumn(
          "USER",
          "password_reset_expires_at",
          {
            type: Sequelize.DATE,
            allowNull: true,
          },
          { transaction },
        );
      }

      if (!tableInfo.password_changed_at) {
        await queryInterface.addColumn(
          "USER",
          "password_changed_at",
          {
            type: Sequelize.DATE,
            allowNull: true,
          },
          { transaction },
        );
      }

      const indexes = await queryInterface.showIndex("USER", {
        transaction,
      });
      const hasResetTokenIndex = indexes.some(
        (index) => index.name === "user_password_reset_token_hash_idx",
      );

      if (!hasResetTokenIndex) {
        await queryInterface.addIndex("USER", ["password_reset_token_hash"], {
          name: "user_password_reset_token_hash_idx",
          transaction,
        });
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
      const tableInfo = await queryInterface.describeTable("USER", {
        transaction,
      });
      const indexes = await queryInterface.showIndex("USER", {
        transaction,
      });
      const hasResetTokenIndex = indexes.some(
        (index) => index.name === "user_password_reset_token_hash_idx",
      );

      if (hasResetTokenIndex) {
        await queryInterface.removeIndex(
          "USER",
          "user_password_reset_token_hash_idx",
          { transaction },
        );
      }
      if (tableInfo.password_changed_at) {
        await queryInterface.removeColumn("USER", "password_changed_at", {
          transaction,
        });
      }

      if (tableInfo.password_reset_expires_at) {
        await queryInterface.removeColumn("USER", "password_reset_expires_at", {
          transaction,
        });
      }

      if (tableInfo.password_reset_token_hash) {
        await queryInterface.removeColumn("USER", "password_reset_token_hash", {
          transaction,
        });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
