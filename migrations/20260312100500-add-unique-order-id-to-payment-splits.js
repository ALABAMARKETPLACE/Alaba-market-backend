"use strict";

module.exports = {
  async up(queryInterface) {
    const indexes = await queryInterface.showIndex("PAYMENT_SPLITS");

    const hasLegacyOrderIndex = indexes.some(
      (index) => index.name === "idx_payment_splits_order_id",
    );

    if (hasLegacyOrderIndex) {
      await queryInterface.removeIndex(
        "PAYMENT_SPLITS",
        "idx_payment_splits_order_id",
      );
    }

    const hasUniqueOrderIndex = indexes.some(
      (index) => index.name === "ux_payment_splits_order_id",
    );

    if (!hasUniqueOrderIndex) {
      await queryInterface.addIndex("PAYMENT_SPLITS", ["order_id"], {
        name: "ux_payment_splits_order_id",
        unique: true,
      });
    }
  },

  async down(queryInterface) {
    const indexes = await queryInterface.showIndex("PAYMENT_SPLITS");

    const hasUniqueOrderIndex = indexes.some(
      (index) => index.name === "ux_payment_splits_order_id",
    );

    if (hasUniqueOrderIndex) {
      await queryInterface.removeIndex(
        "PAYMENT_SPLITS",
        "ux_payment_splits_order_id",
      );
    }

    const hasLegacyOrderIndex = indexes.some(
      (index) => index.name === "idx_payment_splits_order_id",
    );

    if (!hasLegacyOrderIndex) {
      await queryInterface.addIndex("PAYMENT_SPLITS", ["order_id"], {
        name: "idx_payment_splits_order_id",
      });
    }
  },
};
