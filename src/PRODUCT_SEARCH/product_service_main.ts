import { createStructuredLogger } from "../shared/logger/structured-logger";
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
  HttpException,
} from "@nestjs/common";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { getErrorMessage } from "../shared/helpers/errormessage";
import { UUID } from "crypto";
import { Op, Sequelize } from "sequelize";
import { Products } from "../PRODUCTS/products.entity";
import { ProductAttributes } from "./attributes";
import { UserHistory } from "../USER_HISTORY/userhistory.entity";
import { Store } from "../STORE/store.entity";
import { RecommendationDto } from "./dto/recommendation.dto";
import { FeaturedProductsService } from "../FEATURED_PRODUCTS/featured-products.service";
import { BoostedCategoryDto } from "./dto/boosted-category.dto";
import { ProductSearchServiceSingle } from "./product_search_single";
import { ProductSearchSingleDto } from "./dto/productSearchSingle.dto";

const appLog = createStructuredLogger("product_service_main");

@Injectable()
export class ProductServiceMain extends ProductAttributes {
  constructor(
    @Inject("Slugify") private readonly slugify: (slug: string) => string,
    private readonly featuredProductsService: FeaturedProductsService,
    private readonly productSearchSingle: ProductSearchServiceSingle,
  ) {
    super();
  }
  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    );
  }

  async fetchOneProduct(identifier: string, userId: number) {
    try {
      if (userId) {
        const data = await this.findProduct(identifier, userId);
        return new DataResponseDto(data, true, "Success");
      } else {
        const data = await this.findProduct(identifier, null);
        return new DataResponseDto(data, true, "Success");
      }
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async fetchOneProductBySlug(slug: string, userId: number) {
    try {
      const data = await this.findProductBySlug(slug, userId || null);
      return new DataResponseDto(data, true, "Success");
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }

      appLog.info({err})

      appLog.error("[fetchOneProductBySlug] Unexpected error:", err?.message || err);
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async findProduct(identifier: string, userId: number | null | undefined) {
    try {
      const normalizedIdentifier = String(identifier || "").trim();
      const where = this.isUuid(normalizedIdentifier)
        ? { pid: normalizedIdentifier as unknown as UUID }
        : { slug: this.slugify(normalizedIdentifier) };

      const data: any = await Products.findOne({
        where,
        include: [
          ...this.modalsToInclude,
          ...(userId ? this.loggedUserModels(userId) : []),
        ],
        attributes: {
          exclude: this.fetchOneExcludeAttributes,
        },
      });

      if (!data) {
        throw new NotFoundException("Product not found");
      }

      data.setDataValue("id", data._id);

      if (userId) {
        this.applyUserFlags(data);
        this.addtoHistory(userId, data?._id);
      }
      return data;
    } catch (err) {
      throw err;
    }
  }

  async findProductBySlug(slug: string, userId: number | null | undefined) {
    try {
      const normalizedSlug = this.slugify(String(slug || "").trim());

      const data: any = await Products.findOne({
        where: { slug: normalizedSlug },
        include: [
          ...this.modalsToInclude,
          ...(userId ? this.loggedUserModels(userId) : []),
        ],
        attributes: {
          exclude: this.fetchOneExcludeAttributes,
        },
      });

      if (!data) {
        throw new NotFoundException("Product not found");
      }

      data.setDataValue("id", data._id);

      if (userId) {
        this.applyUserFlags(data);
        this.addtoHistory(userId, data?._id);
      }
      return data;
    } catch (err) {
      throw err;
    }
  }

  private applyUserFlags(data: any): void {
    data.setDataValue("cart", Array.isArray(data.cartDetail) && data.cartDetail.length > 0);
    data.setDataValue("wishlist", Array.isArray(data.wishLists) && data.wishLists.length > 0);
    data.setDataValue("review", Array.isArray(data.productReview) && data.productReview.length > 0);
  }

  async addtoHistory(userId: number, productId: number) {
    try {
      const exist = await UserHistory.findOne({
        where: { userId, productId },
      });
      if (exist) {
        exist.variantId = Date.now();
        await exist.save();
        return;
      }
      await UserHistory.create({
        userId,
        productId,
      });
      return;
    } catch (err) {
      return;
    }
  }

  // async getRecommendations(data: RecommendationDto) {
  //   try {
  //     const { lattitude, longitude, radius, query } = data;
  //     let prodNames = await Products.findAll({
  //       where: {
  //         slug: { [Op.like]: `%${this.slugify(query)}%` },
  //       },
  //       attributes: this.autoCompleteAttributes,
  //       limit: 10,
  //       order: [
  //         Sequelize.literal(
  //           `CASE WHEN \"Products"."slug\" LIKE '${this.slugify(
  //             query
  //           )}%' THEN 0 ELSE 1 END`
  //         ),
  //         ["slug", "ASC"],
  //       ],
  //       include: [
  //         {
  //           model: Store,
  //           required: true,
  //           attributes: [],
  //           where: {
  //             ...(lattitude && longitude && radius
  //               ? [Sequelize.literal(`HaversineDistance(?, ?, lat, long) <= ?`)]
  //               : []),
  //              status: "approved"
  //           },
  //         },
  //       ],
  //       replacements: [lattitude, longitude, radius],
  //     });
  //     return new DataResponseDto(prodNames, true, "Success");
  //   } catch (err) {
  //     throw new InternalServerErrorException(getErrorMessage(err));
  //   }
  // }
  async getRecommendations(data: RecommendationDto) {
    try {
      const { lattitude, longitude, radius, query } = data;
      let prodNames = await Products.findAll({
        where: {
          [Op.or]: [
            {
              slug: { [Op.like]: `%${this.slugify(query)}%` },
            },
            {
              bar_code: { [Op.like]: `%${query}%` },
            },
          ],
        },
        attributes: this.autoCompleteAttributes,
        limit: 10,
        order: [
          Sequelize.literal(
            `CASE 
            WHEN "Products"."bar_code" = '${query}' THEN 0
            WHEN "Products"."slug" LIKE '${this.slugify(query)}%' THEN 1 
            WHEN "Products"."bar_code" LIKE '${query}%' THEN 2
            ELSE 3 
          END`,
          ),
          ["slug", "ASC"],
        ],
        include: [
          {
            model: Store,
            required: true,
            attributes: [],
            where: {
              ...(lattitude && longitude && radius
                ? [Sequelize.literal(`HaversineDistance(?, ?, lat, long) <= ?`)]
                : []),
              status: "approved",
            },
          },
        ],
        replacements: [lattitude, longitude, radius],
      });
      return new DataResponseDto(prodNames, true, "Success");
    } catch (err) {
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async fetchBoostedCategory(
    pageOpt: BoostedCategoryDto,
  ): Promise<DataResponseDto> {
    const {
      category,
      subCategory,
      store_id,
      search,
      page = 1,
      take = 10,
      order,
      price,
    } = pageOpt;

    if (!category && !subCategory) {
      throw new BadRequestException(
        "category or subCategory is required for boosted category search",
      );
    }

    const positions: Array<1 | 2 | 3> = [1, 2, 3];
    const combined: any[] = [];
    const seenIds = new Set<number>();

    for (const position of positions) {
      const response =
        await this.featuredProductsService.getAllProductsForPosition(position, {
          page: 1,
          take: Math.min(take * page, 100),
          category,
          store_id,
          search,
        } as any);

      const products = Array.isArray(response?.data?.products)
        ? response.data.products
        : [];

      for (const product of products) {
        const productId = product?._id ?? product?.id;
        if (!productId || seenIds.has(productId)) {
          continue;
        }

        if (
          subCategory &&
          Number(product?.subCategory ?? product?.subcategory_id) !==
            Number(subCategory)
        ) {
          continue;
        }

        combined.push(product);
        seenIds.add(productId);
      }
    }

    const fallbackTake = Math.min(take * page, 100);
    const fallbackQuery: ProductSearchSingleDto = {
      page: 1,
      take: fallbackTake,
      category,
      subCategory,
      storeId: store_id,
      query: search ?? "",
      price: price as any,
      order: order as any,
    } as ProductSearchSingleDto;

    const fallbackResponse = await this.productSearchSingle.fetchProductsSingle(
      fallbackQuery,
    );
    const fallbackProducts = Array.isArray(fallbackResponse?.data)
      ? fallbackResponse.data
      : [];

    for (const product of fallbackProducts) {
      const productId = product?._id ?? product?.id;
      if (!productId || seenIds.has(productId)) {
        continue;
      }

      combined.push(product);
      seenIds.add(productId);
    }

    const total = combined.length;
    const startIndex = (page - 1) * take;
    const paginated = combined.slice(startIndex, startIndex + take);

    const pageOptions = {
      page,
      take,
    } as any;

    return new DataResponseDto(
      paginated,
      true,
      "Successful",
      pageOptions,
      total,
    );
  }
}
