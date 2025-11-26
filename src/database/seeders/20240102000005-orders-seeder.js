/* eslint-disable prettier/prettier */
// "use strict";

// const { v4: uuidv4 } = require("uuid");

// module.exports = {
//   up: async (queryInterface) => {
//     const buyers = (
//       await queryInterface.sequelize.query(`SELECT id FROM users WHERE role = 'buyer'`)
//     )[0];

//     const sellers = (await queryInterface.sequelize.query(
//       `SELECT id FROM users WHERE role = 'seller'`
//     ))[0];

//     const products = (await queryInterface.sequelize.query(
//       `SELECT id, price, sellerId FROM products`
//     ))[0];

//     const drivers = (await queryInterface.sequelize.query(
//       `SELECT id FROM drivers`
//     ))[0];

//     const deliveryCompany = (await queryInterface.sequelize.query(
//       `SELECT id FROM delivery_companies LIMIT 1`
//     ))[0][0];

//     const orders = [];

//     for (let i = 1; i <= 20; i++) {
//       const product = products[Math.floor(Math.random() * products.length)];
//       const buyer = buyers[Math.floor(Math.random() * buyers.length)];
//       const driver = drivers[Math.floor(Math.random() * drivers.length)];

//       const qty = Math.floor(Math.random() * 3 + 1);
//       const total = product.price * qty;

//       orders.push({
//         id: uuidv4(),
//         buyerId: buyer.id,
//         sellerId: product.sellerId,
//         productId: product.id,
//         deliveryCompanyId: deliveryCompany.id,
//         driverId: driver.id,
//         quantity: qty,
//         unitPrice: product.price,
//         totalPrice: total,
//         deliveryFee: 1000,
//         status: "pending",
//         paymentStatus: "pending",
//         barcodeShortCode: `BSC-${10000 + i}`,
//         deliveryCode: `DVC-${20000 + i}`,
//         deliveryAddress: "12 Allen Avenue, Ikeja",
//         deliveryCity: "Ikeja",
//         deliveryState: "Lagos",
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       });
//     }

//     await queryInterface.bulkInsert("orders", orders, {});
//   },

//   down: async (queryInterface) => {
//     await queryInterface.bulkDelete("orders", null, {});
//   },
// };

'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface) => {
    const buyers = (
      await queryInterface.sequelize.query(
        `SELECT id FROM users WHERE role = 'buyer'`
      )
    )[0];

    const sellers = (
      await queryInterface.sequelize.query(
        `SELECT id FROM users WHERE role = 'seller'`
      )
    )[0];

    const products = (
      await queryInterface.sequelize.query(
        `SELECT id, price, "sellerId" FROM products`
      )
    )[0];

    const drivers = (
      await queryInterface.sequelize.query(
        `SELECT id FROM drivers`
      )
    )[0];

    const deliveryCompany = (
      await queryInterface.sequelize.query(
        `SELECT id FROM delivery_companies LIMIT 1`
      )
    )[0][0];

    const orders = [];

    for (let i = 1; i <= 20; i++) {
      const product = products[Math.floor(Math.random() * products.length)];
      const buyer = buyers[Math.floor(Math.random() * buyers.length)];
      const driver = drivers[Math.floor(Math.random() * drivers.length)];

      const qty = Math.floor(Math.random() * 3 + 1);
      const total = product.price * qty;

      orders.push({
        id: uuidv4(),
        buyerId: buyer.id,
        sellerId: product.sellerId,
        productId: product.id,
        deliveryCompanyId: deliveryCompany.id,
        driverId: driver.id,
        quantity: qty,
        unitPrice: product.price,
        totalPrice: total,
        deliveryFee: 1000,
        status: 'pending',
        paymentStatus: 'pending',
        barcodeShortCode: `BSC-${10000 + i}`,
        deliveryCode: `DVC-${20000 + i}`,
        deliveryAddress: '12 Allen Avenue, Ikeja',
        deliveryCity: 'Ikeja',
        deliveryState: 'Lagos',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    await queryInterface.bulkInsert('orders', orders, {});
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('orders', null, {});
  },
};
