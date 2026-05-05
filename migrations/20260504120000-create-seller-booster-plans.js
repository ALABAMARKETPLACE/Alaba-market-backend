"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const [tables] = await queryInterface.sequelize.query(
        `
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name IN ('SELLER_BOOSTER_PLANS', 'BOOSTED_PRODUCTS')
        `,
        { transaction },
      );
      const existingTables = new Set(tables.map((row) => row.table_name));

      if (!existingTables.has("SELLER_BOOSTER_PLANS")) {
        await queryInterface.createTable(
          "SELLER_BOOSTER_PLANS",
          {
            id: {
              type: Sequelize.BIGINT,
              primaryKey: true,
              autoIncrement: true,
              allowNull: false,
            },
            store_id: {
              type: Sequelize.BIGINT,
              allowNull: false,
              references: { model: "STORE", key: "id" },
              onUpdate: "CASCADE",
              onDelete: "RESTRICT",
            },
            seller_id: {
              type: Sequelize.INTEGER,
              allowNull: false,
              references: { model: "USER", key: "_id" },
              onUpdate: "CASCADE",
              onDelete: "RESTRICT",
            },
            tier: {
              type: Sequelize.ENUM("basic", "gold", "premium"),
              allowNull: false,
            },
            status: {
              type: Sequelize.ENUM("active", "expired", "cancelled", "pending"),
              allowNull: false,
              defaultValue: "pending",
            },
            product_limit: {
              type: Sequelize.INTEGER,
              allowNull: true,
            },
            duration_days: {
              type: Sequelize.INTEGER,
              allowNull: false,
              defaultValue: 30,
            },
            starts_at: {
              type: Sequelize.DATE,
              allowNull: true,
            },
            expires_at: {
              type: Sequelize.DATE,
              allowNull: true,
            },
            paystack_reference: {
              type: Sequelize.STRING,
              allowNull: false,
              unique: true,
            },
            amount: {
              type: Sequelize.INTEGER,
              allowNull: false,
            },
            selected_product_ids: {
              type: Sequelize.JSONB,
              allowNull: true,
            },
            created_at: {
              type: Sequelize.DATE,
              allowNull: false,
              defaultValue: Sequelize.fn("NOW"),
            },
            updated_at: {
              type: Sequelize.DATE,
              allowNull: false,
              defaultValue: Sequelize.fn("NOW"),
            },
          },
          { transaction },
        );
      }

      if (!existingTables.has("BOOSTED_PRODUCTS")) {
        await queryInterface.createTable(
          "BOOSTED_PRODUCTS",
          {
            id: {
              type: Sequelize.BIGINT,
              primaryKey: true,
              autoIncrement: true,
              allowNull: false,
            },
            store_id: {
              type: Sequelize.BIGINT,
              allowNull: false,
              references: { model: "STORE", key: "id" },
              onUpdate: "CASCADE",
              onDelete: "RESTRICT",
            },
            seller_id: {
              type: Sequelize.INTEGER,
              allowNull: false,
              references: { model: "USER", key: "_id" },
              onUpdate: "CASCADE",
              onDelete: "RESTRICT",
            },
            product_id: {
              type: Sequelize.BIGINT,
              allowNull: false,
              references: { model: "PRODUCTS", key: "_id" },
              onUpdate: "CASCADE",
              onDelete: "RESTRICT",
            },
            booster_plan_id: {
              type: Sequelize.BIGINT,
              allowNull: false,
              references: { model: "SELLER_BOOSTER_PLANS", key: "id" },
              onUpdate: "CASCADE",
              onDelete: "CASCADE",
            },
            tier: {
              type: Sequelize.ENUM("basic", "gold", "premium"),
              allowNull: false,
            },
            boost_score: {
              type: Sequelize.INTEGER,
              allowNull: false,
              defaultValue: 0,
            },
            starts_at: {
              type: Sequelize.DATE,
              allowNull: false,
            },
            expires_at: {
              type: Sequelize.DATE,
              allowNull: false,
            },
            status: {
              type: Sequelize.ENUM("active", "expired", "cancelled"),
              allowNull: false,
              defaultValue: "active",
            },
            created_at: {
              type: Sequelize.DATE,
              allowNull: false,
              defaultValue: Sequelize.fn("NOW"),
            },
            updated_at: {
              type: Sequelize.DATE,
              allowNull: false,
              defaultValue: Sequelize.fn("NOW"),
            },
          },
          { transaction },
        );
      }

      const productsTable = await queryInterface.describeTable("PRODUCTS", {
        transaction,
      });

      if (!productsTable.is_boosted) {
        await queryInterface.addColumn(
          "PRODUCTS",
          "is_boosted",
          {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          },
          { transaction },
        );
      }

      if (!productsTable.boost_score) {
        await queryInterface.addColumn(
          "PRODUCTS",
          "boost_score",
          {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0,
          },
          { transaction },
        );
      }

      if (!productsTable.boosted_until) {
        await queryInterface.addColumn(
          "PRODUCTS",
          "boosted_until",
          {
            type: Sequelize.DATE,
            allowNull: true,
          },
          { transaction },
        );
      }

      await queryInterface.sequelize.query(
        `
          CREATE INDEX IF NOT EXISTS seller_booster_plans_store_status_idx
            ON "SELLER_BOOSTER_PLANS" ("store_id", "status", "expires_at");
          CREATE INDEX IF NOT EXISTS seller_booster_plans_seller_status_idx
            ON "SELLER_BOOSTER_PLANS" ("seller_id", "status");
          CREATE INDEX IF NOT EXISTS boosted_products_plan_status_idx
            ON "BOOSTED_PRODUCTS" ("booster_plan_id", "status");
          CREATE INDEX IF NOT EXISTS boosted_products_product_status_idx
            ON "BOOSTED_PRODUCTS" ("product_id", "status", "expires_at");
          CREATE INDEX IF NOT EXISTS products_active_boost_idx
            ON "PRODUCTS" ("is_boosted", "boost_score", "boosted_until");
        `,
        { transaction },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const productsTable = await queryInterface.describeTable("PRODUCTS", {
        transaction,
      });

      await queryInterface.sequelize.query(
        `
          DROP INDEX IF EXISTS products_active_boost_idx;
          DROP INDEX IF EXISTS boosted_products_product_status_idx;
          DROP INDEX IF EXISTS boosted_products_plan_status_idx;
          DROP INDEX IF EXISTS seller_booster_plans_seller_status_idx;
          DROP INDEX IF EXISTS seller_booster_plans_store_status_idx;
        `,
        { transaction },
      );

      if (productsTable.boosted_until) {
        await queryInterface.removeColumn("PRODUCTS", "boosted_until", {
          transaction,
        });
      }

      if (productsTable.boost_score) {
        await queryInterface.removeColumn("PRODUCTS", "boost_score", {
          transaction,
        });
      }

      if (productsTable.is_boosted) {
        await queryInterface.removeColumn("PRODUCTS", "is_boosted", {
          transaction,
        });
      }

      await queryInterface.dropTable("BOOSTED_PRODUCTS", { transaction });
      await queryInterface.dropTable("SELLER_BOOSTER_PLANS", { transaction });

      await queryInterface.sequelize.query(
        `
          DROP TYPE IF EXISTS "enum_BOOSTED_PRODUCTS_tier";
          DROP TYPE IF EXISTS "enum_BOOSTED_PRODUCTS_status";
          DROP TYPE IF EXISTS "enum_SELLER_BOOSTER_PLANS_tier";
          DROP TYPE IF EXISTS "enum_SELLER_BOOSTER_PLANS_status";
        `,
        { transaction },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
