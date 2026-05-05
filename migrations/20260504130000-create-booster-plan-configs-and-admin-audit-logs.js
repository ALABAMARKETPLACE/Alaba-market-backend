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
            AND table_name IN (
              'BOOSTER_PLAN_CONFIGS',
              'ADMIN_AUDIT_LOGS',
              'SELLER_BOOSTER_PLANS'
            )
        `,
        { transaction },
      );
      const existingTables = new Set(tables.map((row) => row.table_name));

      if (!existingTables.has("BOOSTER_PLAN_CONFIGS")) {
        await queryInterface.createTable(
          "BOOSTER_PLAN_CONFIGS",
          {
            id: {
              type: Sequelize.BIGINT,
              primaryKey: true,
              autoIncrement: true,
              allowNull: false,
            },
            name: {
              type: Sequelize.ENUM("basic", "gold", "premium"),
              allowNull: false,
              unique: true,
            },
            display_name: {
              type: Sequelize.STRING,
              allowNull: false,
            },
            description: {
              type: Sequelize.TEXT,
              allowNull: true,
            },
            product_limit: {
              type: Sequelize.INTEGER,
              allowNull: true,
            },
            boost_score: {
              type: Sequelize.INTEGER,
              allowNull: false,
              defaultValue: 0,
            },
            duration_days: {
              type: Sequelize.INTEGER,
              allowNull: false,
              defaultValue: 30,
            },
            price: {
              type: Sequelize.INTEGER,
              allowNull: false,
            },
            currency: {
              type: Sequelize.STRING,
              allowNull: false,
              defaultValue: "NGN",
            },
            is_active: {
              type: Sequelize.BOOLEAN,
              allowNull: false,
              defaultValue: true,
            },
            is_unlimited: {
              type: Sequelize.BOOLEAN,
              allowNull: false,
              defaultValue: false,
            },
            created_by: {
              type: Sequelize.INTEGER,
              allowNull: true,
              references: { model: "USER", key: "_id" },
              onUpdate: "CASCADE",
              onDelete: "SET NULL",
            },
            updated_by: {
              type: Sequelize.INTEGER,
              allowNull: true,
              references: { model: "USER", key: "_id" },
              onUpdate: "CASCADE",
              onDelete: "SET NULL",
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

      if (!existingTables.has("ADMIN_AUDIT_LOGS")) {
        await queryInterface.createTable(
          "ADMIN_AUDIT_LOGS",
          {
            id: {
              type: Sequelize.BIGINT,
              primaryKey: true,
              autoIncrement: true,
              allowNull: false,
            },
            actor_id: {
              type: Sequelize.INTEGER,
              allowNull: false,
            },
            actor_role: {
              type: Sequelize.STRING,
              allowNull: false,
            },
            target_user_id: {
              type: Sequelize.INTEGER,
              allowNull: true,
            },
            action: {
              type: Sequelize.STRING,
              allowNull: false,
            },
            module: {
              type: Sequelize.STRING,
              allowNull: false,
            },
            before_data: {
              type: Sequelize.JSONB,
              allowNull: true,
            },
            after_data: {
              type: Sequelize.JSONB,
              allowNull: true,
            },
            ip_address: {
              type: Sequelize.STRING,
              allowNull: true,
            },
            created_at: {
              type: Sequelize.DATE,
              allowNull: false,
              defaultValue: Sequelize.fn("NOW"),
            },
          },
          { transaction },
        );
      }

      await queryInterface.sequelize.query(
        `
          INSERT INTO "BOOSTER_PLAN_CONFIGS"
            (
              "name",
              "display_name",
              "description",
              "product_limit",
              "boost_score",
              "duration_days",
              "price",
              "currency",
              "is_active",
              "is_unlimited",
              "created_at",
              "updated_at"
            )
          VALUES
            (
              'basic',
              'Basic',
              'Boost up to 5 selected active products.',
              5,
              30,
              30,
              500000,
              'NGN',
              TRUE,
              FALSE,
              NOW(),
              NOW()
            ),
            (
              'gold',
              'Gold',
              'Boost up to 20 selected active products.',
              20,
              60,
              30,
              1500000,
              'NGN',
              TRUE,
              FALSE,
              NOW(),
              NOW()
            ),
            (
              'premium',
              'Premium',
              'Boost all active products in your store.',
              NULL,
              100,
              30,
              5000000,
              'NGN',
              TRUE,
              TRUE,
              NOW(),
              NOW()
            )
          ON CONFLICT ("name") DO NOTHING;
        `,
        { transaction },
      );

      if (existingTables.has("SELLER_BOOSTER_PLANS")) {
        const planTable = await queryInterface.describeTable(
          "SELLER_BOOSTER_PLANS",
          { transaction },
        );

        if (!planTable.boost_score) {
          await queryInterface.addColumn(
            "SELLER_BOOSTER_PLANS",
            "boost_score",
            {
              type: Sequelize.INTEGER,
              allowNull: false,
              defaultValue: 0,
            },
            { transaction },
          );
        }

        if (!planTable.price) {
          await queryInterface.addColumn(
            "SELLER_BOOSTER_PLANS",
            "price",
            {
              type: Sequelize.INTEGER,
              allowNull: false,
              defaultValue: 0,
            },
            { transaction },
          );
        }

        if (!planTable.currency) {
          await queryInterface.addColumn(
            "SELLER_BOOSTER_PLANS",
            "currency",
            {
              type: Sequelize.STRING,
              allowNull: false,
              defaultValue: "NGN",
            },
            { transaction },
          );
        }

        if (!planTable.is_unlimited) {
          await queryInterface.addColumn(
            "SELLER_BOOSTER_PLANS",
            "is_unlimited",
            {
              type: Sequelize.BOOLEAN,
              allowNull: false,
              defaultValue: false,
            },
            { transaction },
          );
        }

        if (!planTable.booster_plan_config_id) {
          await queryInterface.addColumn(
            "SELLER_BOOSTER_PLANS",
            "booster_plan_config_id",
            {
              type: Sequelize.BIGINT,
              allowNull: true,
              references: { model: "BOOSTER_PLAN_CONFIGS", key: "id" },
              onUpdate: "CASCADE",
              onDelete: "SET NULL",
            },
            { transaction },
          );
        }

        await queryInterface.sequelize.query(
          `
            UPDATE "SELLER_BOOSTER_PLANS" AS sbp
            SET
              "booster_plan_config_id" = bpc."id",
              "boost_score" = COALESCE(NULLIF(sbp."boost_score", 0), bpc."boost_score"),
              "price" = COALESCE(NULLIF(sbp."price", 0), sbp."amount", bpc."price"),
              "currency" = COALESCE(sbp."currency", bpc."currency", 'NGN'),
              "is_unlimited" = bpc."is_unlimited"
            FROM "BOOSTER_PLAN_CONFIGS" bpc
            WHERE sbp."tier"::text = bpc."name"::text;
          `,
          { transaction },
        );
      }

      await queryInterface.sequelize.query(
        `
          CREATE INDEX IF NOT EXISTS booster_plan_configs_active_idx
            ON "BOOSTER_PLAN_CONFIGS" ("is_active");
          CREATE INDEX IF NOT EXISTS admin_audit_logs_actor_idx
            ON "ADMIN_AUDIT_LOGS" ("actor_id", "created_at");
          CREATE INDEX IF NOT EXISTS admin_audit_logs_module_action_idx
            ON "ADMIN_AUDIT_LOGS" ("module", "action", "created_at");
          CREATE INDEX IF NOT EXISTS seller_booster_plans_config_idx
            ON "SELLER_BOOSTER_PLANS" ("booster_plan_config_id");
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
      const [tables] = await queryInterface.sequelize.query(
        `
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name IN (
              'BOOSTER_PLAN_CONFIGS',
              'ADMIN_AUDIT_LOGS',
              'SELLER_BOOSTER_PLANS'
            )
        `,
        { transaction },
      );
      const existingTables = new Set(tables.map((row) => row.table_name));

      await queryInterface.sequelize.query(
        `
          DROP INDEX IF EXISTS seller_booster_plans_config_idx;
          DROP INDEX IF EXISTS admin_audit_logs_module_action_idx;
          DROP INDEX IF EXISTS admin_audit_logs_actor_idx;
          DROP INDEX IF EXISTS booster_plan_configs_active_idx;
        `,
        { transaction },
      );

      if (existingTables.has("SELLER_BOOSTER_PLANS")) {
        const planTable = await queryInterface.describeTable(
          "SELLER_BOOSTER_PLANS",
          { transaction },
        );

        for (const column of [
          "booster_plan_config_id",
          "is_unlimited",
          "currency",
          "price",
          "boost_score",
        ]) {
          if (planTable[column]) {
            await queryInterface.removeColumn("SELLER_BOOSTER_PLANS", column, {
              transaction,
            });
          }
        }
      }

      if (existingTables.has("ADMIN_AUDIT_LOGS")) {
        await queryInterface.dropTable("ADMIN_AUDIT_LOGS", { transaction });
      }

      if (existingTables.has("BOOSTER_PLAN_CONFIGS")) {
        await queryInterface.dropTable("BOOSTER_PLAN_CONFIGS", { transaction });
      }

      await queryInterface.sequelize.query(
        `
          DROP TYPE IF EXISTS "enum_BOOSTER_PLAN_CONFIGS_name";
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
