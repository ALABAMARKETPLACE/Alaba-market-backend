"use strict";

/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  const transaction = await queryInterface.sequelize.transaction();

  try {
    // Make existing fields nullable
    await queryInterface.changeColumn(
      "ORDER",
      "userId",
      {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      { transaction },
    );

    await queryInterface.changeColumn(
      "ORDER",
      "addressId",
      {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      { transaction },
    );

    // Add guest identification fields
    await queryInterface.addColumn(
      "ORDER",
      "is_guest_order",
      {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: "True if this order was placed by a guest user (no account)",
      },
      { transaction },
    );

    await queryInterface.addColumn(
      "ORDER",
      "guest_email",
      {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: "Guest user email address",
      },
      { transaction },
    );

    await queryInterface.addColumn(
      "ORDER",
      "guest_first_name",
      {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: "Guest user first name",
      },
      { transaction },
    );

    await queryInterface.addColumn(
      "ORDER",
      "guest_last_name",
      {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: "Guest user last name",
      },
      { transaction },
    );

    await queryInterface.addColumn(
      "ORDER",
      "guest_phone",
      {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: "Guest user phone number",
      },
      { transaction },
    );

    await queryInterface.addColumn(
      "ORDER",
      "guest_country_code",
      {
        type: Sequelize.STRING(10),
        allowNull: true,
        comment: "Guest user country code (e.g., +234)",
      },
      { transaction },
    );

    // Add inline delivery address fields
    await queryInterface.addColumn(
      "ORDER",
      "delivery_full_name",
      {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: "Delivery recipient full name",
      },
      { transaction },
    );

    await queryInterface.addColumn(
      "ORDER",
      "delivery_phone",
      {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: "Delivery contact phone number",
      },
      { transaction },
    );

    await queryInterface.addColumn(
      "ORDER",
      "delivery_address",
      {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: "Full delivery address (for guest orders)",
      },
      { transaction },
    );

    await queryInterface.addColumn(
      "ORDER",
      "delivery_city",
      {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: "Delivery city",
      },
      { transaction },
    );

    await queryInterface.addColumn(
      "ORDER",
      "delivery_state",
      {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: "Delivery state/province name",
      },
      { transaction },
    );

    await queryInterface.addColumn(
      "ORDER",
      "delivery_state_id",
      {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: "Delivery state ID (foreign key reference)",
      },
      { transaction },
    );

    await queryInterface.addColumn(
      "ORDER",
      "delivery_country",
      {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: "Delivery country name",
      },
      { transaction },
    );

    await queryInterface.addColumn(
      "ORDER",
      "delivery_country_id",
      {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: "Delivery country ID (foreign key reference)",
      },
      { transaction },
    );

    await queryInterface.addColumn(
      "ORDER",
      "delivery_landmark",
      {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: "Delivery address landmark",
      },
      { transaction },
    );

    await queryInterface.addColumn(
      "ORDER",
      "delivery_address_type",
      {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: "Address type: Home, Office, Other",
      },
      { transaction },
    );

    // Add payment & metadata fields
    await queryInterface.addColumn(
      "ORDER",
      "payment_reference",
      {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: "Payment reference number",
      },
      { transaction },
    );

    await queryInterface.addColumn(
      "ORDER",
      "transaction_reference",
      {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: "Payment gateway transaction reference",
      },
      { transaction },
    );

    await queryInterface.addColumn(
      "ORDER",
      "order_notes",
      {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: "Order notes from customer",
      },
      { transaction },
    );

    await queryInterface.addColumn(
      "ORDER",
      "preferred_delivery_time",
      {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: "Preferred delivery time window",
      },
      { transaction },
    );

    await queryInterface.addColumn(
      "ORDER",
      "order_source",
      {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: "Order source: web, mobile_app, etc.",
      },
      { transaction },
    );

    await queryInterface.addColumn(
      "ORDER",
      "device_id",
      {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: "Device ID for guest session tracking",
      },
      { transaction },
    );

    // Add indexes for performance
    await queryInterface.addIndex("ORDER", ["guest_email"], {
      name: "idx_orders_guest_email",
      transaction,
    });

    await queryInterface.addIndex("ORDER", ["is_guest_order"], {
      name: "idx_orders_is_guest",
      transaction,
    });

    await queryInterface.addIndex("ORDER", ["payment_reference"], {
      name: "idx_orders_payment_ref",
      transaction,
    });

    await transaction.commit();
    console.log("✅ Migration completed successfully");
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Migration failed:", error);
    throw error;
  }
}
export async function down(queryInterface, Sequelize) {
  const transaction = await queryInterface.sequelize.transaction();

  try {
    // Remove indexes
    await queryInterface.removeIndex("ORDER", "idx_orders_guest_email", {
      transaction,
    });
    await queryInterface.removeIndex("ORDER", "idx_orders_is_guest", {
      transaction,
    });
    await queryInterface.removeIndex("ORDER", "idx_orders_payment_ref", {
      transaction,
    });

    // Remove columns
    await queryInterface.removeColumn("ORDER", "is_guest_order", {
      transaction,
    });
    await queryInterface.removeColumn("ORDER", "guest_email", { transaction });
    await queryInterface.removeColumn("ORDER", "guest_first_name", {
      transaction,
    });
    await queryInterface.removeColumn("ORDER", "guest_last_name", {
      transaction,
    });
    await queryInterface.removeColumn("ORDER", "guest_phone", { transaction });
    await queryInterface.removeColumn("ORDER", "guest_country_code", {
      transaction,
    });
    await queryInterface.removeColumn("ORDER", "delivery_full_name", {
      transaction,
    });
    await queryInterface.removeColumn("ORDER", "delivery_phone", {
      transaction,
    });
    await queryInterface.removeColumn("ORDER", "delivery_address", {
      transaction,
    });
    await queryInterface.removeColumn("ORDER", "delivery_city", {
      transaction,
    });
    await queryInterface.removeColumn("ORDER", "delivery_state", {
      transaction,
    });
    await queryInterface.removeColumn("ORDER", "delivery_state_id", {
      transaction,
    });
    await queryInterface.removeColumn("ORDER", "delivery_country", {
      transaction,
    });
    await queryInterface.removeColumn("ORDER", "delivery_country_id", {
      transaction,
    });
    await queryInterface.removeColumn("ORDER", "delivery_landmark", {
      transaction,
    });
    await queryInterface.removeColumn("ORDER", "delivery_address_type", {
      transaction,
    });
    await queryInterface.removeColumn("ORDER", "payment_reference", {
      transaction,
    });
    await queryInterface.removeColumn("ORDER", "transaction_reference", {
      transaction,
    });
    await queryInterface.removeColumn("ORDER", "order_notes", { transaction });
    await queryInterface.removeColumn("ORDER", "preferred_delivery_time", {
      transaction,
    });
    await queryInterface.removeColumn("ORDER", "order_source", { transaction });
    await queryInterface.removeColumn("ORDER", "device_id", { transaction });

    // Restore NOT NULL constraints
    await queryInterface.changeColumn(
      "ORDER",
      "userId",
      {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      { transaction },
    );

    await queryInterface.changeColumn(
      "ORDER",
      "addressId",
      {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      { transaction },
    );

    await transaction.commit();
    console.log("✅ Rollback completed successfully");
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Rollback failed:", error);
    throw error;
  }
}
