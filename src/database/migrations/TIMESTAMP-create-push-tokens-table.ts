'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('push_tokens', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      token: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      device_type: {
        type: Sequelize.ENUM('ios', 'android'),
        allowNull: false,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Add unique index for user_id + token combination
    await queryInterface.addIndex('push_tokens', ['user_id', 'token'], {
      unique: true,
      name: 'push_tokens_user_token_unique',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('push_tokens');
  },
};
