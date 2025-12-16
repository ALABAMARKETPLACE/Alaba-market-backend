import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Wishlist } from "./wishlist.entity";
import { CreateWishlistDto } from "./dto/create-wishlist.dto";
import { Sequelize } from "sequelize";
import { escape } from "querystring";
import { PageOptionsDto } from "../shared/dto/pageOptions.dto";
import { Products } from "../PRODUCTS/products.entity";
import { ProductVariant } from "../PRODUCT_VARIANTS/productvariant.entity";

@Injectable()
export class WishlistRepository {
  constructor(
    @Inject("WishlistRepository")
    private readonly wishListRepository: typeof Wishlist
  ) {}
  async addtoWishlist(userId: number, create: CreateWishlistDto) {
    try {
      const [wishlist, created] = await this.wishListRepository.findOrCreate({
        where: {
          productId: Sequelize.literal(
            `"productId" = (SELECT "_id" FROM "PRODUCTS" WHERE "pid" = '${escape(
              create?.productId
            )}')`
          ),
          userId,
          ...(create?.variantId && { variantId: create.variantId }),
        },
        defaults: {
          userId: userId,
          productId: Sequelize.literal(
            `(SELECT "_id" FROM "PRODUCTS" WHERE "pid" = '${escape(
              create.productId
            )}')`
          ),
          variantId: create?.variantId,
        },
      });
      if (created == false) {
       await wishlist.destroy()
      }
      return { wishlist, created };
    } catch (error) {
      throw error;
    }
  }

  async getAllWishList(userId: number, pageOptionsDto: PageOptionsDto) {
    try {
      const skip = (pageOptionsDto.page - 1) * pageOptionsDto.take;
      const { rows, count } = await this.wishListRepository.findAndCountAll({
        where: {
          userId: userId,
        },
        attributes: [
          "id",
          "productId",
          "variantId",
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
          [Sequelize.col("productDetails.pid"), "pid"],
          [Sequelize.col("productDetails.slug"), "slug"],
          [Sequelize.col("productDetails.totalReviews"), "totalReviews"],
          [Sequelize.col("productDetails.averageRating"), "averageRating"],
          [
            Sequelize.literal(
              `COALESCE("variantDetails"."units", "productDetails"."unit")`
            ),
            "unit",
          ],
          [Sequelize.col("productDetails.status"), "status"],
          [Sequelize.col("productDetails.name"), "name"],
          [Sequelize.col("productDetails.description"), "description"],
          [Sequelize.col("variantDetails.combination"), "combination"],
        ],
        include: [
          {
            model: Products,
            required: true,
            attributes: [],
          },
          {
            model: ProductVariant,
            required: false,
            attributes: [],
          },
        ],
        limit: pageOptionsDto.take,
        offset: skip,
        order: [["createdAt", "DESC"]],
      });
      return { rows, count };
    } catch (error) {
      throw error;
    }
  }
  async removeWishlist(userId: number, id: number) {
    try {
      const wishlist = await this.wishListRepository.destroy({
        where: {
          id,
          userId,
        },
      });
      if (wishlist === 0) {
        throw new NotFoundException("Wishlist item not found");
      }
      return wishlist;
    } catch (error) {
      throw error;
    }
  }
}
