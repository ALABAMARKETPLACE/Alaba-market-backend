"use strict";
const fs = require("fs");
const path = require("path");
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const seedDataPath = path.join(__dirname, "data.json");
    const data = JSON.parse(fs.readFileSync(seedDataPath, "utf8"));
    await queryInterface.bulkInsert("STORE", data["STORE"]);
    await queryInterface.bulkInsert("USER", data["USER"]);
    await queryInterface.bulkInsert("SETTINGS", data["SETTINGS"]);
    await queryInterface.bulkInsert("CATEGORY", data["CATEGORY"]);
    await queryInterface.bulkInsert("SUB_CATEGORY", data["SUB_CATEGORY"]);
    await queryInterface.bulkInsert("DELIVERY_CHARGE", data["DELIVERY_CHARGE"]);
    await queryInterface.bulkInsert("DISTANCE_CHARGE", data["DISTANCE_CHARGE"]);
    await queryInterface.bulkInsert("PRODUCTS", data["PRODUCTS"]);
    await queryInterface.bulkInsert("BANNER", data["BANNER"]);
  },

  async down(queryInterface, Sequelize) {
    const seedDataPath = path.join(__dirname, "data.json");
    const data = JSON.parse(fs.readFileSync(seedDataPath, "utf8"));
    await queryInterface.bulkDelete("PRODUCTS", {
      _id: data["PRODUCTS"]?.map((item) => item?._id),
    });
    await queryInterface.bulkDelete("USER", {
      _id: data["USER"]?.map((item) => item?._id),
    });
    await queryInterface.bulkDelete("BANNER", {
      id: data["BANNER"]?.map((item) => item?.id),
    });
    await queryInterface.bulkDelete("STORE", {
      id: data["STORE"]?.map((item) => item?.id),
    });
    await queryInterface.bulkDelete("SETTINGS", {
      id: data["SETTINGS"]?.map((item) => item?.id),
    });
    await queryInterface.bulkDelete("SUB_CATEGORY", {
      _id: data["SUB_CATEGORY"]?.map((item) => item?._id),
    });
    await queryInterface.bulkDelete("CATEGORY", {
      id: data["CATEGORY"]?.map((item) => item?.id),
    });
    await queryInterface.bulkDelete("DELIVERY_CHARGE", {
      id: data["DELIVERY_CHARGE"]?.map((item) => item?.id),
    });
    await queryInterface.bulkDelete("DISTANCE_CHARGE", {
      id: data["DISTANCE_CHARGE"]?.map((item) => item?.id),
    });
  },
};
