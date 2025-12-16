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
      await queryInterface.sequelize.query(`SELECT id FROM users WHERE role = 'buyer'`)
    )[0];

    const sellers = (
      await queryInterface.sequelize.query(`SELECT id FROM users WHERE role = 'seller'`)
    )[0];

    const products = (
      await queryInterface.sequelize.query(`SELECT id, price, "sellerId" FROM products`)
    )[0];

    const drivers = (await queryInterface.sequelize.query(`SELECT id FROM drivers`))[0];

    const deliveryCompany = (
      await queryInterface.sequelize.query(`SELECT id FROM delivery_companies LIMIT 1`)
    )[0][0];

    // Valid Lagos locations with coordinates for routing
    const deliveryLocations = [
      {
        address: '12 Allen Avenue, Ikoyi, Lagos',
        city: 'Ikoyi',
        state: 'Lagos',
        lat: 6.4626,
        lng: 3.4264,
      },
      {
        address: 'Plot 1, Ligali Ayorinde Street, Victoria Island, Lagos',
        city: 'Victoria Island',
        state: 'Lagos',
        lat: 6.4344,
        lng: 3.4289,
      },
      {
        address: '16 Ajose Adeogun Street, Victoria Island, Lagos',
        city: 'Victoria Island',
        state: 'Lagos',
        lat: 6.4324,
        lng: 3.4308,
      },
      {
        address: '89 Surulere Way, Surulere, Lagos',
        city: 'Surulere',
        state: 'Lagos',
        lat: 6.4989,
        lng: 3.3656,
      },
      {
        address: '123 Awolowo Road, Ikoyi, Lagos',
        city: 'Ikoyi',
        state: 'Lagos',
        lat: 6.4606,
        lng: 3.4239,
      },
      {
        address: '45 Opebi Link Road, Ikeja, Lagos',
        city: 'Ikeja',
        state: 'Lagos',
        lat: 6.5869,
        lng: 3.3428,
      },
      {
        address: '56 Bode Thomas Street, Surulere, Lagos',
        city: 'Surulere',
        state: 'Lagos',
        lat: 6.5044,
        lng: 3.3612,
      },
      {
        address: '78 Lekki Epe Expressway, Lekki, Lagos',
        city: 'Lekki',
        state: 'Lagos',
        lat: 6.4769,
        lng: 3.5486,
      },
    ];

    // Origin/warehouse locations (where deliveries start from)
    const originLocations = [
      {
        address: '1 Murtala Mohammed Way, Ikoyi, Lagos',
        city: 'Ikoyi',
        state: 'Lagos',
        lat: 6.465,
        lng: 3.42,
      },
      {
        address: '42 Ahmadu Bello Way, Victoria Island, Lagos',
        city: 'Victoria Island',
        state: 'Lagos',
        lat: 6.43,
        lng: 3.435,
      },
      {
        address: '11 Opebi Link Road, Ikeja, Lagos',
        city: 'Ikeja',
        state: 'Lagos',
        lat: 6.58,
        lng: 3.34,
      },
      {
        address: '32 Bode Thomas Street, Surulere, Lagos',
        city: 'Surulere',
        state: 'Lagos',
        lat: 6.5,
        lng: 3.36,
      },
      {
        address: '5 Chevron Drive, Lekki, Lagos',
        city: 'Lekki',
        state: 'Lagos',
        lat: 6.47,
        lng: 3.54,
      },
    ];

    const orders = [];

    for (let i = 1; i <= 15; i++) {
      const product =
        products.length > 0 ? products[Math.floor(Math.random() * products.length)] : null;
      const buyer = buyers.length > 0 ? buyers[Math.floor(Math.random() * buyers.length)] : null;
      const driver =
        drivers.length > 0 ? drivers[Math.floor(Math.random() * drivers.length)] : null;
      const deliveryLocation =
        deliveryLocations[Math.floor(Math.random() * deliveryLocations.length)];
      const originLocation = originLocations[Math.floor(Math.random() * originLocations.length)];

      if (!product || !buyer || !driver) continue;

      const qty = Math.floor(Math.random() * 3 + 1);
      const total = parseFloat(product.price) * qty;

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
        status: 'out_for_delivery',
        paymentStatus: 'pending',
        barcodeShortCode: `BSC-${10000 + i}`,
        deliveryCode: `DVC-${20000 + i}`,
        deliveryAddress: deliveryLocation.address,
        deliveryCity: deliveryLocation.city,
        deliveryState: deliveryLocation.state,
        deliveryLatitude: deliveryLocation.lat,
        deliveryLongitude: deliveryLocation.lng,
        originLatitude: originLocation.lat,
        originLongitude: originLocation.lng,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    if (orders.length > 0) {
      await queryInterface.bulkInsert('orders', orders, {});
    }
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('orders', null, {});
  },
};
