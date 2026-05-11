import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { CartTable } from "./cart.entity";
import { Op, Sequelize, Transaction } from "sequelize";
import { InjectModel } from "@nestjs/sequelize";
import { Products } from "../PRODUCTS/products.entity";
import { Store } from "../STORE/store.entity";
import { ProductVariant } from "../PRODUCT_VARIANTS/productvariant.entity";
import { CreateCartDto } from "./dto/cart_create.dto";

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

  async deleteCartByProduct(
    userId: number,
    productId: string,
    variantId?: string
  ) {
    try {
      const rawProductId = String(productId || "").trim();
      const numericProductId = Number(rawProductId);
      const product = await Products.findOne({
        where:
          rawProductId && Number.isFinite(numericProductId)
            ? { _id: numericProductId }
            : { pid: rawProductId },
        attributes: ["_id"],
      });

      if (!product) throw new NotFoundException("Product not found");

      const normalizedVariantId =
        variantId && Number(variantId) > 0 ? Number(variantId) : null;
      const deleted = await this.cartRepository.destroy({
        where: {
          userId,
          productId: product._id,
          ...(normalizedVariantId ? { variantId: normalizedVariantId } : {}),
        },
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
        limit: 20,
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
          [Sequelize.col("productDetails.product_weight"), "productWeight"],
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
      const requestedQuantity = Math.max(1, Number(data?.quantity || 1));
      const rawProductId = String(data.productId || "").trim();
      const numericProductId = Number(rawProductId);
      const productWhere =
        rawProductId && Number.isFinite(numericProductId)
          ? { _id: numericProductId }
          : { pid: rawProductId };
      const product = await Products.findOne({
        where: productWhere,
        attributes: ["_id", "name", "status", "unit"],
      });

      if (!product) {
        throw new NotFoundException("Product not found");
      }

      if (product.status === false) {
        throw new ServiceUnavailableException("Product is not available");
      }

      let availableUnits = Number(product.unit || 0);

      if (availableUnits <= 0) {
        throw new ServiceUnavailableException("Product is out of stock");
      }

      const normalizedVariantId =
        data?.variantId && Number(data.variantId) > 0
          ? Number(data.variantId)
          : null;

      if (normalizedVariantId) {
        const variant = await ProductVariant.findOne({
          where: {
            id: normalizedVariantId,
            productId: product._id,
          },
          attributes: ["id", "units"],
        });

        if (!variant) {
          throw new NotFoundException(
            "Variant not found for the selected product"
          );
        }

        availableUnits = Number(variant.units || 0);

        if (availableUnits <= 0) {
          throw new ServiceUnavailableException("Variant is out of stock");
        }
      }

      const maxAllowedQuantity = Math.min(25, availableUnits);

      if (requestedQuantity > maxAllowedQuantity) {
        throw new BadRequestException(
          `Only ${maxAllowedQuantity} item${
            maxAllowedQuantity === 1 ? "" : "s"
          } left in stock`
        );
      }

      const [cart, created] = await this.cartRepository.findOrCreate({
        where: {
          productId: product._id,
          userId,
          ...(normalizedVariantId && { variantId: normalizedVariantId }),
        },
        defaults: {
          userId,
          productId: product._id,
          quantity: requestedQuantity,
          buyPrice: 0,
          variantId: normalizedVariantId,
        },
      });

      if (created == false) {
        const nextQuantity = Number(cart.quantity) + requestedQuantity;

        if (nextQuantity > maxAllowedQuantity) {
          throw new BadRequestException(
            `Only ${maxAllowedQuantity} item${
              maxAllowedQuantity === 1 ? "" : "s"
            } left in stock`
          );
        }

        cart.quantity = nextQuantity;
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
      SET "quantity" = GREATEST(
        0,
        LEAST(
          "CART"."quantity" + ?,
          COALESCE(
            (
              SELECT "units"
              FROM "PRODUCT_VARIANT"
              WHERE "PRODUCT_VARIANT"."id" = "CART"."variantId"
              AND "PRODUCT_VARIANT"."productId" = "PRODUCTS"."_id"
            ),
            "PRODUCTS"."unit"
          ),
          25
        )
      )
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
