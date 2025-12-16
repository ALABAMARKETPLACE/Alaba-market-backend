'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface) => {
    const companies = await queryInterface.sequelize.query(
      `SELECT id FROM delivery_companies LIMIT 1;`,
    );
    const company = companies[0][0];

    // Get driver users
    const driverUsers = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE role = 'driver' LIMIT 5;`,
    );

    const drivers = [];

    for (let i = 1; i <= 5; i++) {
      const driverUser = driverUsers[0][i - 1];

      drivers.push({
        id: uuidv4(),
        companyId: company.id,
        userId: driverUser ? driverUser.id : null,
        name: `Driver ${i}`,
        phone: `0801111${2000 + i}`,
        email: `driver${i}@example.com`,
        licenseNumber: `DL${100000 + i}`,
        vehicleNumber: `VH${100000 + i}`,
        isActive: true,
        isAvailable: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    await queryInterface.bulkInsert('drivers', drivers, {});
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('drivers', null, {});
  },
};
