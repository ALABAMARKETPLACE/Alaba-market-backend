"use strict";

const { v4: uuidv4 } = require("uuid");

module.exports = {
  up: async (queryInterface) => {
    const sellers = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE role = 'seller';`
    );
    const sellerRows = sellers[0];

    const categories = ['Electronics', 'Fashion', 'Groceries', 'Home', 'Phones'];

    const products = [];

    for (let i = 1; i <= 20; i++) {
      const seller = sellerRows[Math.floor(Math.random() * sellerRows.length)];

      products.push({
        id: uuidv4(),
        sellerId: seller.id,
        name: `Product ${i}`,
        description: `Description for product ${i}`,
        price: (Math.random() * 5000 + 1000).toFixed(2),
        stock: Math.floor(Math.random() * 50 + 10),
        // images intentionally omitted in seed to avoid jsonb/array casting issues
        category: categories[Math.floor(Math.random() * categories.length)],
        sku: `SKU-${1000 + i}`,
        weight: 1.5,
        // dimensions intentionally omitted in seed to avoid JSON validation issues
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    await queryInterface.bulkInsert("products", products, {});
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete("products", null, {});
  },
};
