import { createStructuredLogger } from "../shared/logger/structured-logger";
import {
  BadRequestException,
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { Products } from "./products.entity";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { Category } from "../CATEGORY/category.entity";
import { SubCategory } from "../SUB_CATEGORY/sub_category.entity";
import { ProductsPayloadDto } from "./dto/productsPayload.dto";
import { ProductImageService } from "../PRODUCT_IMAGE/productimage.service";
import { ProductVariantService } from "../PRODUCT_VARIANTS/productvariant.service";
import { ProductImage } from "../PRODUCT_IMAGE/productimage.entity";
import { ProductsByStoreDto } from "./dto/productsByStore.dto";
import { Op, Transaction } from "sequelize";
import { Sequelize } from "sequelize-typescript";
import { UpdateProductsDto } from "./dto/updateProduct.dto";
import { UpdateProductImagePayloadDto } from "./dto/updateProductImage.dto";
import { ProductVariant } from "../PRODUCT_VARIANTS/productvariant.entity";
import { UpdateProductStatusDto } from "./dto/updateProductStatus.dto";
import { Store } from "../STORE/store.entity";
import { getErrorMessage } from "../shared/helpers/errormessage";
import { UpdateProductVariantDto } from "./dto/updateVariant.dto";
import { UpdateCoverImage } from "./dto/updateCoverImage";
import { UUID } from "crypto";
import { CartTable } from "../CART/cart.entity";
import { Wishlist } from "../WISHLIST/wishlist.entity";
import { ProductReviews } from "../PRODUCT_REVIEWS/prod_rev.entity";
import { UserHistory } from "../USER_HISTORY/userhistory.entity";
import { Role } from "../shared/enum/role.enum";
import { OrderItems } from '../ORDER_ITEMS/order_items.entity';
import { OfferProducts } from "../OFFER_PRODUCTS/offer_products.entity";
import { SubstituteProducts } from "../ORDER_SUBSTITUTION/substitute.products.entity";

const appLog = createStructuredLogger("products_services");

const pVariantAttributes = [
  "image",
  "available",
  "barcode",
  "combination",
  "price",
  "sku",
  "id",
  "units",
];
const pImageAttributes = ["url", "type", "id"];
@Injectable()
export class ProductsService {
  constructor(
    @Inject("ProductsRepository")
    private readonly ProductsRepository: typeof Products,

    private readonly productsImageService: ProductImageService,
    private readonly productVariantsService: ProductVariantService,

    private readonly sequelize: Sequelize,

    @Inject("Slugify")
    private readonly slugify: (slug: string) => string
  ) {}

  async create(
    storeId: number,
    {
      images,
      information,
      variants,
      coverImage,
      product_video,
    }: ProductsPayloadDto
  ) {
    try {
      appLog.info(
        {
          event: "product_creation_started",
          storeId,
          productWeight: information?.product_weight,
          imageCount: images?.length,
          variantCount: variants?.length,
        },
        "product creation started",
      );

      const response = await this.ProductsRepository.sequelize.transaction(
        async (transaction: Transaction) => {

          if (!coverImage?.url) {
            throw new BadRequestException("Cover image not found.");
          }

          const imageLocation =
          typeof coverImage.url === "string"
            ? coverImage.url
            : coverImage.url?.Location ?? "";

          const newP = {
            name: information?.name,
            image: imageLocation,
            bar_code: information?.bar_code,
            sku: information?.sku,
            brand: information?.brand,
            bulk_order: information?.bulk_order,
            category: information?.category,
            description: information?.description,
            manufacture: information?.manufacture,
            purchase_rate: information?.purchase_rate,
            retail_rate: information?.retail_rate,
            status: information?.status,
            subCategory: information?.subCategory,
            title: information?.name,
            unit: information?.unit,
            units: information?.units,
            store_id: storeId,
            price: information?.retail_rate,
            specifications: information?.specifications,
            slug: this.slugify(information?.name),
            product_video: product_video || null,
            product_weight: information?.product_weight,
          };

          //adding new product
          const product = await this.ProductsRepository.create(newP, {
            transaction: transaction,
          });

          appLog.info(
            {
              event: "product_record_created",
              storeId,
              productId: product._id,
              productWeight: product.product_weight,
            },
            "product record created",
          );
          //adding product images
          const image = await this.productsImageService.create(
            product,
            images,
            transaction
          );
          //adding product variants.
          const { newVariants: variant, totalUnits }: any =
            await this.productVariantsService.create(
              product,
              variants,
              transaction
            );
          //if there is a variant available then we will make one as the primary product
          if (variant?.length && variant[0]?.id) {
            product.bar_code = variant[0]?.barcode;
            product.sku = variant[0]?.sku;
            product.retail_rate = variant[0]?.price;
            product.unit = totalUnits;
            await product.save({ transaction });
          }
          return { product, image, variant };
        }
      );
      return new DataResponseDto(
        response,
        true,
        "Successfully Added new Product"
      );
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async updateProductDetails(
    store_id: number,
    _id: number,
    data: UpdateProductsDto
  ) {
    try {
      const [updated, product] = await this.ProductsRepository.update(
        {
          ...data,
          ...(data?.name && {
            slug: this.slugify(data.name),
          }),
        },
        {
          where: {
            _id,
            store_id,
          },
          returning: true,
        }
      );
      if (updated == 0) throw new NotFoundException();
      return new DataResponseDto(product, true, "Successfully Updated");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async updateProductImages(
    storeId: number,
    pid: number,
    data: UpdateProductImagePayloadDto
  ) {
    try {
      const result = await this.ProductsRepository.sequelize.transaction(
        async (transaction: Transaction) => {
          const product = await this.ProductsRepository.findOne({
            where: { _id: pid, store_id: storeId },
            transaction,
          });
          if (!product) throw new NotFoundException();
          const updated = await this.productsImageService.updateProductImages(
            pid,
            data?.addImages,
            data?.removeImages,
            transaction
          );
          return updated;
        }
      );
      return new DataResponseDto(result, true, "Product Images updated");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }
  async updateProductStatus(
    storeId: number,
    pid: number,
    data: UpdateProductStatusDto
  ) {
    try {
      const result = await this.ProductsRepository.sequelize.transaction(
        async (transaction: Transaction) => {
          const updated = await this.ProductsRepository.findOne({
            where: { _id: pid, store_id: storeId },
            transaction: transaction,
          });
          if (!updated) throw new Error("No Product Found@@");
          updated.status = data?.status;
          await updated.save({ transaction: transaction });
          return updated;
        }
      );
      return new DataResponseDto(
        result,
        true,
        "Product Status Updated successfully"
      );
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  // async delete(storeId: number, id: number) {
  //   try {
  //     const product = await this.ProductsRepository.findOne({
  //       where: { _id: id, store_id: storeId },
  //     });
  //     if (!product) throw new Error("No Product available@@");
  //     await product.destroy();
  //     return new DataResponseDto(product, true, "Successfully Deleted");
  //   } catch (err) {
  //     if (err instanceof HttpException) throw err;
  //     throw new InternalServerErrorException(getErrorMessage(err));
  //   }
  // }

  async delete(
    storeId: number,
    id: number,
    role: Role
  ): Promise<DataResponseDto> {
    try {
      const where =
        role === Role.Admin
          ? { _id: id }
          : { _id: id, store_id: storeId };

      const product = await this.ProductsRepository
        .unscoped()
        .findOne({ where });

      if (!product) {
        throw new NotFoundException("Product not found");
      }

      /* =========================
        ADMIN → HARD DELETE
      ========================== */
      if (role === Role.Admin) {
        return await this.sequelize.transaction(async (transaction) => {
          await Promise.all([
            CartTable.destroy({ where: { productId: id }, transaction }),
            Wishlist.destroy({ where: { productId: id }, transaction }),
            ProductReviews.destroy({ where: { product_id: id }, transaction }),
            ProductVariant.destroy({ where: { productId: id }, transaction }),
            UserHistory.destroy({ where: { productId: id }, transaction }),

            // 🔥 MISSING TABLES (CRITICAL)
            OrderItems.destroy({ where: { productId: id }, transaction }),
            ProductImage.destroy({ where: { productId: id }, transaction }),
            OfferProducts.destroy({ where: { productId: id }, transaction }),
            SubstituteProducts.destroy({ where: { productId: id }, transaction }),
          ]);

          // finally delete product
          await product.destroy({ transaction });

          return new DataResponseDto(
            null,
            true,
            "Product and all related records deleted permanently"
          );
        });
      }

      /* =========================
        SELLER → SAFE DELETE
      ========================== */
      const [
        cartCount,
        wishlistCount,
        reviewCount,
        variantCount,
        historyCount,
      ] = await Promise.all([
        CartTable.count({ where: { productId: id } }),
        Wishlist.count({ where: { productId: id } }),
        ProductReviews.count({ where: { product_id: id } }),
        ProductVariant.count({ where: { productId: id } }),
        UserHistory.count({ where: { productId: id } }),
      ]);

      const hasReferences =
        cartCount +
          wishlistCount +
          reviewCount +
          variantCount +
          historyCount >
        0;

      if (hasReferences) {
        product.status = false;
        await product.save();

        return new DataResponseDto(
          null,
          true,
          "Product has references and was disabled instead"
        );
      }

      await product.destroy();
      return new DataResponseDto(null, true, "Product deleted successfully");

    } catch (err) {
      if (err instanceof HttpException) throw err;

      if (err?.name === "SequelizeForeignKeyConstraintError") {
        throw new BadRequestException(
          "Product cannot be deleted because it is referenced"
        );
      }

      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }
  
  modalsToInclude = [
    {
      model: Category,
      required: true,
      attributes: ["name"],
    },
    {
      model: SubCategory,
      required: true,
      attributes: ["name"],
    },
    {
      model: ProductImage,
      required: false,
      attributes: pImageAttributes,
    },
    {
      model: ProductVariant,
      required: false,
      attributes: pVariantAttributes,
    },
    { model: Store, required: true, attributes: ["store_name"] },
  ];

  async findOne(pid: UUID) {
    try {
      const data = await this.ProductsRepository.findOne<Products>({
        where: { pid },
        include: this.modalsToInclude,
        attributes: {
          include: [
            [
              Sequelize.literal(
                '(SELECT AVG(rating) FROM "PRODUCT_REVIEWS" WHERE "PRODUCT_REVIEWS"."product_id" = "Products"."_id")'
              ),
              "averageRating",
            ],
            [
              Sequelize.literal(
                '(SELECT COUNT(*) FROM "PRODUCT_REVIEWS" WHERE "PRODUCT_REVIEWS"."product_id" = "Products"."_id")'
              ),
              "totalReviews",
            ],
          ],
          exclude: [
            "purchase_rate",
            "orderCount",
            "createdAt",
            "updatedAt",
            "",
          ],
        },
      });
      if (!data) {
        throw new Error("No Data found@@");
      }
      return new DataResponseDto(data, true, "Success");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async findProductWithUser(userId: number, pid: UUID) {
    try {
      const data: any = await this.ProductsRepository.findOne<Products>({
        where: { pid },
        include: [
          ...this.modalsToInclude,
          {
            model: CartTable,
            required: false,
            where: { userId },
            attributes: ["variantId"],
          },
          {
            model: Wishlist,
            required: false,
            where: { userId },
            attributes: [],
          },
          {
            model: ProductReviews,
            required: false,
            where: { user_id: userId },
            attributes: [],
          },
        ],
        attributes: {
          include: [
            [
              Sequelize.literal(
                'CASE WHEN "cartDetail"."id" IS NOT NULL THEN TRUE ELSE FALSE END'
              ),
              "cart",
            ],
            [
              Sequelize.literal(
                'CASE WHEN "wishLists"."id" IS NOT NULL THEN TRUE ELSE FALSE END'
              ),
              "wishlist",
            ],
            [
              Sequelize.literal(
                'CASE WHEN "productReview"."_id" IS NOT NULL THEN TRUE ELSE FALSE END'
              ),
              "review",
            ],
            [
              Sequelize.literal(
                '(SELECT AVG(rating) FROM "PRODUCT_REVIEWS" WHERE "PRODUCT_REVIEWS"."product_id" = "Products"."_id")'
              ),
              "averageRating",
            ],
            [
              Sequelize.literal(
                '(SELECT COUNT(*) FROM "PRODUCT_REVIEWS" WHERE "PRODUCT_REVIEWS"."product_id" = "Products"."_id")'
              ),
              "totalReviews",
            ],
          ],
          exclude: ["purchase_rate", "orderCount", "createdAt", "updatedAt"],
        },
      });
      //adding the product to us'ers history
      try {
        const addtoHistory = await data?.createProductHistory({
          userId,
          productId: data?._id,
        });
      } catch (err) {
        if (err.name == "SequelizeUniqueConstraintError") {
          try {
            const update = await UserHistory.findOne({
              where: { userId, productId: data?._id },
            });
            update.variantId = Date.now();
            await update.save();
          } catch (err) {}
        }
      }
      return new DataResponseDto(data, true, "Success");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async findOneForSeller(storeId: number, id: number) {
    try {
      const data = await this.ProductsRepository.findOne<Products>({
        where: {
          _id: id,
          store_id: storeId,
        },
        include: this.modalsToInclude,
        order: [[Sequelize.col("productImages.id"), "ASC"]],
      });
      if (!data) {
        throw new Error("No Product found@@");
      }
      return new DataResponseDto(data, true, "Success");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  //do not change.

  async updateProductVariant(
    storeId: number,
    id: number,
    data: UpdateProductVariantDto
  ) {
    try {
      const result = await this.ProductsRepository.sequelize.transaction(
        async (transaction: Transaction) => {
          const variant = await ProductVariant.findByPk(id, { transaction });
          if (!variant) {
            throw new Error("No Variant found.@@");
          }
          if (data?.units) {
            variant.units = data?.units;
          }
          if (data?.price) {
            variant.price = data?.price;
          }
          if (data?.image) {
            variant.image = data?.image;
          }
          const updated = await variant.save({ transaction });
          const variants = await ProductVariant.findAll({
            where: {
              productId: variant.productId,
            },
            transaction,
          });
          let totalUnits = 0;
          variants.forEach((item: any) => {
            totalUnits += Number(item?.units);
          });
          const product = await this.ProductsRepository.findOne({
            where: { _id: variant?.productId, store_id: storeId },
            transaction,
          });
          if (!product) throw new Error("No Product can be found@@");
          product.unit = totalUnits;
          await product.save({ transaction });
          return product;
        }
      );

      return new DataResponseDto(result, true, "Success");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }
  async updateCoverImage(id: number, storeId: number, body: UpdateCoverImage) {
    try {
      const product = await this.ProductsRepository.findOne({
        where: {
          _id: id,
          store_id: storeId,
        },
      });
      if (!product) throw new Error("No Product is found@@");
      product.image = body.image;
      await product.save({});
      return new DataResponseDto(product, true, "Image updated successfully");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async deleteImage(id: number) {
    try {
      const deleted = await ProductImage.destroy({
        where: {
          id,
        },
      });
      if (deleted == 0) throw new NotFoundException();
      return new DataResponseDto(deleted, "Image Removed..");
    } catch (err) {
      throw new InternalServerErrorException();
    }
  }

  async checkSameStore(pids: string[]): Promise<DataResponseDto> {
    try {
      if (!pids || pids.length === 0) {
        throw new BadRequestException("At least one product ID is required");
      }

      // Get all products with the provided PIDs
      const products = await this.ProductsRepository.findAll({
        where: {
          pid: {
            [Op.in]: pids,
          },
        },
        attributes: ["_id", "pid", "store_id"],
      });

      // Check if all PIDs were found
      if (products.length !== pids.length) {
        const foundPidsSet = new Set(products.map((p) => String(p.pid)));
        const notFoundPids = pids.filter((pid) => !foundPidsSet.has(pid));
        throw new NotFoundException(
          `Products not found for PIDs: ${notFoundPids.join(", ")}`
        );
      }

      // Get unique store IDs
      const storeIds = [
        ...new Set(products.map((product) => product.store_id)),
      ];

      // Check if products are from different stores
      if (storeIds.length > 1) {
        throw new BadRequestException(
          "Please choose products from same store for low delivery charge and to get offers"
        );
      }

      // If all products are from the same store
      return new DataResponseDto({}, true, "Products are from same store");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }
}
