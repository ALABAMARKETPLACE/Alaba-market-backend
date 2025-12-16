import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { Op, Sequelize } from "sequelize";
import { Products } from "../PRODUCTS/products.entity";
import { getErrorMessage } from "../shared/helpers/errormessage";
import { ProductSearchSingleDto } from "./dto/productSearchSingle.dto";
import { Store } from "../STORE/store.entity";
import { ProductAttributes } from "./attributes";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { ProductVariant } from "../PRODUCT_VARIANTS/productvariant.entity";
import { BoostRequest } from "../BOOST_REQUESTS/boost-request.entity";
@Injectable()
export class ProductSearchServiceSingle extends ProductAttributes {
  constructor(
    @Inject("Slugify") private readonly slugify: (slug: string) => string
  ) {
    super();
  }

  /**
   * Get active boosted product IDs with their priorities
   * Returns a Map of productId -> { priority, approvedAt }
   */
  private async getActiveBoostedProducts(): Promise<
    Map<number, { priority: number; approvedAt: Date }>
  > {
    try {
      const activeBoosts = await BoostRequest.findAll({

        attributes: ["product_ids", "boost_priority", "approved_at"],
        order: [
          ["boost_priority", "ASC"],
          ["approved_at", "ASC"],
        ],
      });

      const boostMap = new Map<
        number,
        { priority: number; approvedAt: Date }
      >();

      // Build map: productId -> { priority, approvedAt }
      // If a product appears in multiple boosts, keep the one with lower priority
      activeBoosts.forEach((boost) => {
        const priority = (boost as any).boost_priority || 100;
        const approvedAt = boost.approved_at;

        if (boost.product_ids && Array.isArray(boost.product_ids)) {
          boost.product_ids.forEach((productId: number) => {
            const existing = boostMap.get(productId);
            if (!existing || priority < existing.priority) {
              boostMap.set(productId, { priority, approvedAt });
            }
          });
        }
      });

      return boostMap;
    } catch (err) {
      console.error("Error fetching boosted products:", err);
      return new Map();
    }
  }
  async fetchProductsSingle(
    pageOptions: ProductSearchSingleDto,
    defaultStore: boolean = false
  ) {
    const {
      storeId,
      page,
      take,
      order,
      category,
      subCategory,
      query,
      price,
      tag,
      exclude,
      instock,
      status,
    } = pageOptions;
    const skip = (page - 1) * take;
    try {
      // Step 1: Get active boosted products
      const boostMap = await this.getActiveBoostedProducts();
      const boostedProductIds = Array.from(boostMap.keys());

      // Step 2: Build common where clause for product filters
      const commonProductWhere: any = {
        ...(storeId ? {} : { status: true }),
        ...(query && {
          [Op.or]: [
            { slug: { [Op.like]: `%${this.slugify(query)}%` } },
            ...(storeId ? [{ bar_code: { [Op.eq]: query } }] : []),
          ],
        }),
        ...(category && { category }),
        ...(subCategory && { subCategory }),
        ...(storeId && { store_id: storeId }),
        ...(exclude && { _id: { [Op.notIn]: [exclude] } }),
        ...((instock || status == "instock") && { unit: { [Op.gt]: 0 } }),
        ...(status == "out_of_stock" && { unit: 0 }),
        ...(status == "active" && { status: true }),
        ...(status == "inactive" && { status: false }),
      };

      // Step 3: Fetch boosted products
      let boostedProducts: Products[] = [];
      if (boostedProductIds.length > 0) {
        boostedProducts = await Products.findAll({
          where: {
            ...commonProductWhere,
            _id: { [Op.in]: boostedProductIds },
          },
          attributes: [...this.productAttributes],
          include: [
            {
              model: Store,
              required: true,
              attributes: [],
              where: {
                status: "approved",
              },
            },
            {
              model: ProductVariant,
              required: false,
              attributes: ["price", "id", "image"],
            },
          ],
        });

        // Sort boosted products by priority, then by approved_at
        boostedProducts.sort((a, b) => {
          const boostA = boostMap.get(a._id);
          const boostB = boostMap.get(b._id);
          if (!boostA || !boostB) return 0;

          // First sort by priority (lower is better)
          if (boostA.priority !== boostB.priority) {
            return boostA.priority - boostB.priority;
          }

          // Then by approved_at (earlier is better)
          return boostA.approvedAt.getTime() - boostB.approvedAt.getTime();
        });
      }

      // Step 4: Calculate pagination for boosted products
      const totalBoosted = boostedProducts.length;
      const boostedOnCurrentPage =
        page === 1
          ? Math.min(totalBoosted, take)
          : Math.max(0, Math.min(totalBoosted - skip, take));

      // Get the boosted products for current page
      const boostedForPage =
        boostedOnCurrentPage > 0
          ? boostedProducts.slice(skip, skip + take)
          : [];

      // Step 5: Calculate how many regular products we need
      const regularProductsNeeded = take - boostedForPage.length;
      const regularProductsSkip = Math.max(0, skip - totalBoosted);

      // Step 6: Fetch regular products (exclude boosted)
      let regularProducts: Products[] = [];
      let regularCount = 0;

      if (regularProductsNeeded > 0) {
        const { rows, count } = await Products.findAndCountAll({
          where: {
            ...commonProductWhere,
            _id: { [Op.notIn]: boostedProductIds }, // Exclude boosted products
          },
          limit: regularProductsNeeded,
          order: this.productOrder(order, price, tag),
          offset: regularProductsSkip,
          attributes: [...this.productAttributes],
          include: [
            {
              model: Store,
              required: true,
              attributes: [],
              where: {
                status: "approved",
              },
            },
            {
              model: ProductVariant,
              required: false,
              attributes: ["price", "id", "image"],
            },
          ],
        });

        regularProducts = rows;
        regularCount = count;
      }

      // Step 7: Combine boosted and regular products
      const finalProducts = [...boostedForPage, ...regularProducts];
      const totalCount = totalBoosted + regularCount;

      return new DataResponseDto(
        finalProducts,
        true,
        "Successfull",
        pageOptions,
        totalCount
      );
    } catch (err) {
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }
}
