"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const indexes = await queryInterface.showIndex("ORDER_PAYMENTS");

    for (const index of indexes) {
      const hasRefField = Array.isArray(index.fields)
        ? index.fields.some(
            (field) => field.attribute === "ref" || field.name === "ref",
          )
        : false;

      if (index.unique && hasRefField) {
        await queryInterface.removeIndex("ORDER_PAYMENTS", index.name);
      }
    }

    await queryInterface.changeColumn("ORDER_PAYMENTS", "ref", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addIndex("ORDER_PAYMENTS", ["ref"], {
      name: "idx_order_payments_ref",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex("ORDER_PAYMENTS", "idx_order_payments_ref");

    await queryInterface.changeColumn("ORDER_PAYMENTS", "ref", {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
    });
  },
};
