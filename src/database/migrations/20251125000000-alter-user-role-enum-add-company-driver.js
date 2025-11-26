'use strict';

// Migration to extend enum_users_role with 'company' and 'driver'

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(
      "ALTER TYPE \"enum_users_role\" ADD VALUE IF NOT EXISTS 'company';",
    );
    await queryInterface.sequelize.query(
      "ALTER TYPE \"enum_users_role\" ADD VALUE IF NOT EXISTS 'driver';",
    );
  },

  // Enum value removal is non-trivial in Postgres; keep as no-op.
  down: async () => {},
};
