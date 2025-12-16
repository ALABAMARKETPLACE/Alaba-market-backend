"use strict";
//to run: npx sequelize-cli db:migrate (up)
//npx sequelize-cli db:migrate:undo:all (down)
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // await queryInterface.addIndex("PRODUCTS", ["_id", "store_id"], {
    //   name: "product_id_store_id_index",
    //   using: "BTREE",
    //   fields: [
    //     { name: "_id", order: "ASC", collate: "NULLS LAST" },
    //     { name: "store_id", order: "ASC", collate: "NULLS LAST" },
    //   ],
    //   unique: false,
    //   concurrently: false,
    //   type: "btree",
    //   tablespace: "pg_default",
    // });

    // await queryInterface.addConstraint("PRODUCTS", {
    //   fields: ["unit"],
    //   type: "check",
    //   name: "unit_non_negative",
    //   where: Sequelize.literal('"unit" >= 0'),
    // });
    // await queryInterface.addConstraint("PRODUCTS", {
    //   fields: ["units"],
    //   type: "check",
    //   name: "units_non_negative",
    //   where: Sequelize.literal('"units" >= 0'),
    // });
    // await queryInterface.addConstraint("PRODUCTS", {
    //   fields: ["purchase_rate"],
    //   type: "check",
    //   name: "purchase_rate_non_negative",
    //   where: Sequelize.literal('"purchase_rate" >= 0'),
    // });
    // await queryInterface.addConstraint("SETTLEMENS", {
    //   fields: ["balance"],
    //   type: "check",
    //   name: "balance_non_negative",
    //   where: Sequelize.literal('"balance" >= 0'),
    // });
    // await queryInterface.addConstraint("ORDER", {
    //   fields: ["grandTotal"],
    //   type: "check",
    //   name: "grandTotal_non_negative",
    //   where: Sequelize.literal('"grandTotal" >= 0'),
    // });
    // await queryInterface.addConstraint("ORDER", {
    //   fields: ["total"],
    //   type: "check",
    //   name: "total_non_negative",
    //   where: Sequelize.literal('"total" >= 0'),
    // });
    // await queryInterface.addConstraint("ORDER", {
    //   fields: ["discount"],
    //   type: "check",
    //   name: "discount_non_negative",
    //   where: Sequelize.literal('"discount" >= 0'),
    // });
    // await queryInterface.addConstraint("ORDER", {
    //   fields: ["deliveryCharge"],
    //   type: "check",
    //   name: "deliveryCharge_non_negative",
    //   where: Sequelize.literal('"deliveryCharge" >= 0'),
    // });
    // await queryInterface.addConstraint("CART", {
    //   fields: ["quantity"],
    //   type: "check",
    //   name: "cart_quantity_non_negative",
    //   where: Sequelize.literal('"quantity" >= 0'),
    // });
  },

  async down(queryInterface, Sequelize) {
    // await queryInterface.removeIndex("PRODUCTS", "product_id_store_id_index");
    // await queryInterface.removeConstraint("PRODUCTS", "unit_non_negative");
    // await queryInterface.removeConstraint("PRODUCTS", "units_non_negative");
    // await queryInterface.removeConstraint(
    //   "PRODUCTS",
    //   "purchase_rate_non_negative"
    // );
    // await queryInterface.removeConstraint("SETTLEMENS", "balance_non_negative");
    // await queryInterface.removeConstraint("ORDER", "grandTotal_non_negative");
    // await queryInterface.removeConstraint("ORDER", "total_non_negative");
    // await queryInterface.removeConstraint("ORDER", "discount_non_negative");
    // await queryInterface.removeConstraint(
    //   "ORDER",
    //   "deliveryCharge_non_negative"
    // );
    // await queryInterface.removeConstraint("CART", "cart_quantity_non_negative");
  },
};
