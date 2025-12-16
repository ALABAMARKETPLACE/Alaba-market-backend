"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `CREATE OR REPLACE FUNCTION HaversineDistance(
        lat1 FLOAT, lon1 FLOAT, lat2 FLOAT, lon2 FLOAT
      ) RETURNS FLOAT AS $$
      DECLARE
        R FLOAT = 6371; -- Earth radius in kilometers
        dlat FLOAT;
        dlon FLOAT;
        a FLOAT;
        c FLOAT;
      BEGIN
        dlat := RADIANS(lat2 - lat1);
        dlon := RADIANS(lon2 - lon1);
        a := SIN(dlat / 2) * SIN(dlat / 2) + COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * SIN(dlon / 2) * SIN(dlon / 2);
        c := 2 * ATAN2(SQRT(a), SQRT(1 - a));
        RETURN R * c;
      END;
      $$ LANGUAGE plpgsql;`
    );

    // await queryInterface.sequelize.query(
    //   `CREATE OR REPLACE FUNCTION update_product_review_stats()
    //   RETURNS TRIGGER AS $$
    //   DECLARE
    //       newAverage DECIMAL(3, 2);
    //       newCount INT;
    //   BEGIN
    //       -- Select the new average rating and count of reviews for the product
    //       SELECT AVG(rating), COUNT(*)
    //       INTO newAverage, newCount
    //       FROM "PRODUCT_REVIEWS"
    //       WHERE "product_id" = NEW.product_id;
    //       -- Update the PRODUCTS table with the new average rating and review count
    //       UPDATE "PRODUCTS"
    //       SET "averageRating" = newAverage, "totalReviews" = newCount
    //       WHERE _id = NEW.product_id;
    //       -- Return the new row
    //       RETURN NEW;
    //   END;
    //   $$ LANGUAGE plpgsql;
    //   CREATE OR REPLACE FUNCTION update_product_review_stats_delete()
    //   RETURNS TRIGGER AS $$
    //   DECLARE
    //       newAverage DECIMAL(3, 2);
    //       newCount INT;
    //   BEGIN
    //       -- Select the new average rating and count of reviews for the product
    //       SELECT AVG(rating), COUNT(*)
    //       INTO newAverage, newCount
    //       FROM "PRODUCT_REVIEWS"
    //       WHERE "product_id" = OLD.product_id;
    //       -- Update the PRODUCTS table with the new average rating and review count
    //       UPDATE "PRODUCTS"
    //       SET "averageRating" = COALESCE(newAverage, 0), "totalReviews" = newCount
    //       WHERE _id = OLD.product_id;
    //       -- Return the new row
    //       RETURN NULL;
    //   END;
    //   $$ LANGUAGE plpgsql;
    //   CREATE TRIGGER update_product_review_stats_after_delete
    //   AFTER DELETE ON "PRODUCT_REVIEWS"
    //   FOR EACH ROW
    //   EXECUTE FUNCTION update_product_review_stats_delete();
    //   CREATE TRIGGER update_product_review_stats_after_update
    //   AFTER UPDATE ON "PRODUCT_REVIEWS"
    //   FOR EACH ROW
    //   EXECUTE FUNCTION update_product_review_stats();
    //   CREATE TRIGGER update_product_review_stats_after_insert
    //   AFTER INSERT ON "PRODUCT_REVIEWS"
    //   FOR EACH ROW
    //   EXECUTE FUNCTION update_product_review_stats();`
    // );

    // await queryInterface.sequelize.query(
    //   `CREATE OR REPLACE FUNCTION update_store_review_stats()
    //   RETURNS TRIGGER AS $$
    //   DECLARE
    //       newAverage DECIMAL(3, 2);
    //       newCount INT;
    //   BEGIN
    //       -- Select the new average rating and count of reviews for the product
    //       SELECT AVG(rating), COUNT(id)
    //       INTO newAverage, newCount
    //       FROM "STORE_REVIEW"
    //       WHERE "storeId" = NEW."storeId";
    //       -- Update the PRODUCTS table with the new average rating and review count
    //       UPDATE "STORE"
    //       SET "averageRating" = newAverage, "ratings" = newCount
    //       WHERE id = NEW."storeId";
    //       -- Return the new row
    //       RETURN NEW;
    //   END;
    //   $$ LANGUAGE plpgsql;
    //   CREATE OR REPLACE FUNCTION update_store_review_stats_delete()
    //   RETURNS TRIGGER AS $$
    //   DECLARE
    //       newAverage DECIMAL(3, 2);
    //       newCount INT;
    //   BEGIN
    //       -- Select the new average rating and count of reviews for the product
    //       SELECT AVG(rating), COUNT(id)
    //       INTO newAverage, newCount
    //       FROM "STORE_REVIEW"
    //       WHERE "storeId" = OLD."storeId";
    //       -- Update the PRODUCTS table with the new average rating and review count
    //       UPDATE "STORE"
    //       SET "averageRating" = newAverage, "ratings" = newCount
    //       WHERE id = OLD."storeId";
    //       -- Return the new row
    //       RETURN NULL;
    //   END;
    //   $$ LANGUAGE plpgsql;
    //   CREATE TRIGGER update_store_review_stats_delete
    //   AFTER DELETE ON "STORE_REVIEW"
    //   FOR EACH ROW
    //   EXECUTE FUNCTION update_store_review_stats_delete();
    //   CREATE TRIGGER update_store_review_stats_update
    //   AFTER UPDATE ON "STORE_REVIEW"
    //   FOR EACH ROW
    //   EXECUTE FUNCTION update_store_review_stats();
    //   CREATE TRIGGER update_store_review_stats_insert
    //   AFTER INSERT ON "STORE_REVIEW"
    //   FOR EACH ROW
    //   EXECUTE FUNCTION update_store_review_stats();`
    // );
  },

  async down(queryInterface, Sequelize) {
    // await queryInterface.sequelize.query(
    //   "DROP FUNCTION IF EXISTS HaversineDistance(FLOAT, FLOAT, FLOAT, FLOAT);"
    // );

    // await queryInterface.sequelize.query(
    //   'DROP TRIGGER IF EXISTS update_store_review_stats_delete ON "STORE_REVIEW";'
    // );
    // await queryInterface.sequelize.query(
    //   'DROP TRIGGER IF EXISTS update_store_review_stats_update ON "STORE_REVIEW";'
    // );
    // await queryInterface.sequelize.query(
    //   'DROP TRIGGER IF EXISTS update_store_review_stats_insert ON "STORE_REVIEW";'
    // );

    // await queryInterface.sequelize.query(
    //   "DROP FUNCTION IF EXISTS update_store_review_stats();"
    // );
    // await queryInterface.sequelize.query(
    //   "DROP FUNCTION IF EXISTS update_store_review_stats_delete();"
    // );

    // //
    // await queryInterface.sequelize.query(
    //   'DROP TRIGGER IF EXISTS update_product_review_stats_after_delete ON "PRODUCT_REVIEWS";'
    // );
    // await queryInterface.sequelize.query(
    //   'DROP TRIGGER IF EXISTS update_product_review_stats_after_update ON "PRODUCT_REVIEWS";'
    // );
    // await queryInterface.sequelize.query(
    //   'DROP TRIGGER IF EXISTS update_product_review_stats_after_insert ON "PRODUCT_REVIEWS";'
    // );

    // await queryInterface.sequelize.query(
    //   "DROP FUNCTION IF EXISTS update_product_review_stats();"
    // );
    // await queryInterface.sequelize.query(
    //   "DROP FUNCTION IF EXISTS update_product_review_stats_delete();"
    // );
  },
};
