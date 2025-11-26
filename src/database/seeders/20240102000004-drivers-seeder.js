"use strict";

const { v4: uuidv4 } = require("uuid");

module.exports = {
  up: async (queryInterface) => {
    const companies = await queryInterface.sequelize.query(
      `SELECT id FROM delivery_companies LIMIT 1;`
    );
    const company = companies[0][0];

    const drivers = [];

    for (let i = 1; i <= 5; i++) {
      drivers.push({
        id: uuidv4(),
        companyId: company.id,
        userId: null,
        name: `Driver ${i}`,
        phone: "08011112222",
        email: `driver${i}@example.com`,
        isActive: true,
        isAvailable: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    await queryInterface.bulkInsert("drivers", drivers, {});
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete("drivers", null, {});
  },
};
