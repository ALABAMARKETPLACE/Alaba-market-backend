"use strict";

const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcryptjs");

module.exports = {
  up: async (queryInterface) => {
    const password = await bcrypt.hash('password123', 10);

    const users = [];

    // Create 10 buyers
    for (let i = 1; i <= 10; i++) {
      users.push({
        id: uuidv4(),
        email: `buyer${i}@example.com`,
        password,
        firstName: `Buyer${i}`,
        lastName: "Test",
        phone: "08012345678",
        role: "buyer",
        isActive: true,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Create 5 sellers
    for (let i = 1; i <= 5; i++) {
      users.push({
        id: uuidv4(),
        email: `seller${i}@example.com`,
        password,
        firstName: `Seller${i}`,
        lastName: "Shop",
        phone: "08098765432",
        role: "seller",
        isActive: true,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Create 1 delivery company owner (maps to frontend role "company")
    const deliveryOwner = {
      id: uuidv4(),
      email: "deliveryowner@example.com",
      password,
      firstName: "Delivery",
      lastName: "Owner",
      phone: "08055555555",
      role: "company",
      isActive: true,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    users.push(deliveryOwner);

    // Create a few driver accounts (maps to frontend role "driver")
    for (let i = 1; i <= 3; i++) {
      users.push({
        id: uuidv4(),
        email: `driver${i}@example.com`,
        password,
        firstName: `Driver${i}`,
        lastName: "User",
        phone: "08044443333",
        role: "driver",
        isActive: true,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    await queryInterface.bulkInsert('users', users, {});

    return users;
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('users', null, {});
  },
};
