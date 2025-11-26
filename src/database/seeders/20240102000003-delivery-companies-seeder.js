"use strict";

const { v4: uuidv4 } = require("uuid");

module.exports = {
  up: async (queryInterface) => {
    const [deliveryOwner] = (
      await queryInterface.sequelize.query(
        `SELECT id FROM users WHERE role = 'company' LIMIT 1`
      )
    )[0];

    if (!deliveryOwner) {
      throw new Error('No user with role "company" found for delivery company seeder');
    }

    const companyId = uuidv4();

    await queryInterface.bulkInsert("delivery_companies", [
      {
        id: companyId,
        userId: deliveryOwner.id,
        companyName: "FastMove Logistics",
        description: "Reliable city-wide delivery services",
        // routes omitted in seed; table default will set an empty array
        subscriptionStatus: "active",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    return { companyId };
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete("delivery_companies", null, {});
  },
};
