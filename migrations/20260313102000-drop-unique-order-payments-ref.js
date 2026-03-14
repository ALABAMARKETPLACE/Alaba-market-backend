"use strict";

async function getRefUniqueConstraints(queryInterface, transaction) {
  const [constraints] = await queryInterface.sequelize.query(
    `
      SELECT DISTINCT con.conname AS constraint_name
      FROM pg_constraint con
      INNER JOIN pg_class rel
        ON rel.oid = con.conrelid
      INNER JOIN pg_namespace nsp
        ON nsp.oid = rel.relnamespace
      INNER JOIN unnest(con.conkey) WITH ORDINALITY AS cols(attnum, ordinality)
        ON true
      INNER JOIN pg_attribute attr
        ON attr.attrelid = rel.oid
       AND attr.attnum = cols.attnum
      WHERE nsp.nspname = 'public'
        AND rel.relname = 'ORDER_PAYMENTS'
        AND con.contype = 'u'
        AND attr.attname = 'ref'
    `,
    { transaction },
  );

  return constraints;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const constraints = await getRefUniqueConstraints(queryInterface, transaction);

      for (const constraint of constraints) {
        await queryInterface.removeConstraint(
          "ORDER_PAYMENTS",
          constraint.constraint_name,
          { transaction },
        );
      }

      const indexes = await queryInterface.showIndex("ORDER_PAYMENTS", {
        transaction,
      });

      for (const index of indexes) {
        const hasRefField = Array.isArray(index.fields)
          ? index.fields.some(
              (field) => field.attribute === "ref" || field.name === "ref",
            )
          : false;

        if (!index.unique || !hasRefField) {
          continue;
        }

        try {
          await queryInterface.removeIndex("ORDER_PAYMENTS", index.name, {
            transaction,
          });
        } catch (error) {
          const remainingConstraints = await getRefUniqueConstraints(
            queryInterface,
            transaction,
          );

          const matchingConstraint = remainingConstraints.find(
            (constraint) => constraint.constraint_name === index.name,
          );

          if (matchingConstraint) {
            await queryInterface.removeConstraint(
              "ORDER_PAYMENTS",
              matchingConstraint.constraint_name,
              { transaction },
            );
            await queryInterface.removeIndex("ORDER_PAYMENTS", index.name, {
              transaction,
            });
            continue;
          }

          throw error;
        }
      }

      await queryInterface.changeColumn(
        "ORDER_PAYMENTS",
        "ref",
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction },
      );

      const refreshedIndexes = await queryInterface.showIndex("ORDER_PAYMENTS", {
        transaction,
      });
      const hasRefIndex = refreshedIndexes.some(
        (index) => index.name === "idx_order_payments_ref",
      );

      if (!hasRefIndex) {
        await queryInterface.addIndex("ORDER_PAYMENTS", ["ref"], {
          name: "idx_order_payments_ref",
          transaction,
        });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const constraints = await getRefUniqueConstraints(queryInterface, transaction);
      const indexes = await queryInterface.showIndex("ORDER_PAYMENTS", {
        transaction,
      });
      const hasRefIndex = indexes.some(
        (index) => index.name === "idx_order_payments_ref",
      );

      if (hasRefIndex) {
        await queryInterface.removeIndex("ORDER_PAYMENTS", "idx_order_payments_ref", {
          transaction,
        });
      }

      await queryInterface.changeColumn(
        "ORDER_PAYMENTS",
        "ref",
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction },
      );

      if (constraints.length === 0) {
        await queryInterface.addConstraint("ORDER_PAYMENTS", {
          fields: ["ref"],
          type: "unique",
          name: "ORDER_PAYMENTS_ref_key",
          transaction,
        });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
