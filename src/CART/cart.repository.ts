import { Injectable, NotFoundException } from "@nestjs/common";
import { CartTable } from "./cart.entity";
import { Sequelize, Transaction } from "sequelize";
import { InjectModel } from "@nestjs/sequelize";
import { Products } from "../PRODUCTS/products.entity";
import { Store } from "../STORE/store.entity";
import { ProductVariant } from "../PRODUCT_VARIANTS/productvariant.entity";
import { CreateCartDto } from "./dto/cart_create.dto";
import { escape } from "querystring";

@Injectable()
export class CartRepository {
  constructor(
    @InjectModel(CartTable)
    private readonly cartRepository: typeof CartTable
  ) {}
  async deleteCart(userId: number, id: number) {
    try {
      const deleted = await this.cartRepository.destroy({
        where: { id, userId },
      });
      if (deleted == 0) throw new NotFoundException();
      return deleted;
    } catch (err) {
      throw err;
    }
  }
  async findAll(userId: number) {
    try {
      const cart = await this.cartRepository.findAll({
        where: {
          userId,
        },
        order: [["createdAt", "DESC"]],
        limit:20,
        attributes: [
          "id",
          "productId",
          "variantId",
          "quantity",
          [Sequelize.col("productDetails.store_id"), "storeId"],
          [
            Sequelize.literal(
              `COALESCE("variantDetails"."image", "productDetails"."image")`
            ),
            "image",
          ],
          [
            Sequelize.literal(
              `COALESCE("variantDetails"."price", "productDetails"."retail_rate")`
            ),
            "price",
          ],
          [
            Sequelize.literal(
              `COALESCE("variantDetails"."price", "productDetails"."retail_rate")* "quantity"`
            ),
            "totalPrice",
          ],
          [Sequelize.col("productDetails.pid"), "pid"],
          [Sequelize.col("productDetails.slug"), "slug"],
          [
            Sequelize.literal(
              `COALESCE("variantDetails"."units", "productDetails"."unit")`
            ),
            "unit",
          ],
          [Sequelize.col("productDetails.status"), "status"],
          [Sequelize.col("productDetails.name"), "name"],
          [Sequelize.col("variantDetails.combination"), "combination"],
          [
            Sequelize.col("productDetails.storeDetails.store_name"),
            "storeName",
          ],
        ],
        include: [
          {
            model: Products,
            required: true,
            attributes: [],
            include: [
              {
                model: Store,
                required: true,
                attributes: [],
              },
            ],
          },
          {
            model: ProductVariant,
            required: false,
            attributes: [],
          },
        ],
      });
      return cart;
    } catch (err) {
      throw err;
    }
  }
  async create(userId: number, data: CreateCartDto) {
    try {
      const [cart, created] = await this.cartRepository.findOrCreate({
        where: {
          productId: Sequelize.literal(
            `"productId" = (SELECT "_id" FROM "PRODUCTS" WHERE "pid" = '${escape(
              data.productId
            )}')`
          ),
          userId,
          ...(data?.variantId && { variantId: data.variantId }),
        },
        defaults: {
          userId: userId,
          productId: Sequelize.literal(
            `(SELECT "_id" FROM "PRODUCTS" WHERE "pid" = '${escape(
              data.productId
            )}')`
          ),
          quantity: data.quantity,
          buyPrice: 0,
          //  Sequelize.literal(
          //   `CASE
          //   WHEN ${data.variantId ?? "NULL"} IS NOT NULL
          //   THEN (SELECT "price" FROM "PRODUCT_VARIANT" WHERE "id" = ${
          //     data.variantId ?? "NULL"
          //   })
          //   ELSE (SELECT "retail_rate" FROM "PRODUCTS" WHERE "pid" = '${escape(
          //     data.productId
          //   )}')
          // END`
          // ),
          variantId: data?.variantId,
        },
      });
      if (created == false) {
        cart.quantity += 1;
        await cart.save({});
      }
      return { cart, created };
    } catch (err) {
      throw err;
    }
  }
  async updateCart(where, quantity: number, transaction: Transaction) {
    try {
      const [data] = await this.cartRepository.sequelize.query(
        `UPDATE "CART"
      SET "quantity" = GREATEST(0, LEAST("CART"."quantity" + ?, "PRODUCTS"."unit"))
      FROM "PRODUCTS"
      WHERE "CART"."productId" = "PRODUCTS"."_id"
      AND "CART"."id" = ?
      AND "CART"."userId" = ?
      RETURNING *;
      `,
        { replacements: [quantity, where.id, where.userId], transaction }
      );
      return { count: 1, data: data };
    } catch (err) {
      throw err;
    }
  }
  async removeOne(where, transaction: Transaction) {
    try {
      const deleted = await this.cartRepository.destroy({
        where,
        transaction,
      });
      if (deleted == 0) throw new NotFoundException();
      return deleted;
    } catch (err) {
      throw err;
    }
  }
  async removeAll(userId: number) {
    try {
      const deleted = await this.cartRepository.destroy({
        where: { userId },
      });
      if (deleted == 0) throw new NotFoundException("No Products in Cart");
      return deleted;
    } catch (err) {
      throw err;
    }
  }
}
