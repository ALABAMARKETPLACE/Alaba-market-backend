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
    try {
      /* ============================
      * SAFE PAGINATION DEFAULTS
      * ============================ */
      const safePage =
        Number(pageOptions.page) && Number(pageOptions.page) > 0
          ? Number(pageOptions.page)
          : 1;

      const safeTake =
        Number(pageOptions.take) && Number(pageOptions.take) > 0
          ? Number(pageOptions.take)
          : 10;

      const skip = (safePage - 1) * safeTake;

      /* ============================
      * DESTRUCTURE WITH SAFETY
      * ============================ */
      const {
        storeId,
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

      /* ============================
      * BOOSTED PRODUCTS
      * ============================ */
      const boostMap = await this.getActiveBoostedProducts();
      const boostedProductIds = Array.from(boostMap.keys());

      /* ============================
      * COMMON WHERE CLAUSE
      * ============================ */
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
        ...((instock || status === "instock") && { unit: { [Op.gt]: 0 } }),
        ...(status === "out_of_stock" && { unit: 0 }),
        ...(status === "active" && { status: true }),
        ...(status === "inactive" && { status: false }),
      };

      /* ============================
      * FETCH BOOSTED PRODUCTS
      * ============================ */
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
              where: { status: "approved" },
            },
            {
              model: ProductVariant,
              required: false,
              attributes: ["price", "id", "image"],
            },
          ],
        });

        // sort boosted products
        boostedProducts.sort((a, b) => {
          const boostA = boostMap.get(a._id);
          const boostB = boostMap.get(b._id);
          if (!boostA || !boostB) return 0;

          if (boostA.priority !== boostB.priority) {
            return boostA.priority - boostB.priority;
          }

          return boostA.approvedAt.getTime() - boostB.approvedAt.getTime();
        });
      }

      /* ============================
      * PAGINATE BOOSTED
      * ============================ */
      const totalBoosted = boostedProducts.length;

      const boostedForPage =
        totalBoosted > 0
          ? boostedProducts.slice(skip, skip + safeTake)
          : [];

      /* ============================
      * REGULAR PRODUCTS
      * ============================ */
      const regularProductsNeeded = safeTake - boostedForPage.length;
      const regularProductsSkip = Math.max(0, skip - totalBoosted);

      let regularProducts: Products[] = [];
      let regularCount = 0;

      if (regularProductsNeeded > 0) {
        const { rows, count } = await Products.findAndCountAll({
          where: {
            ...commonProductWhere,
            ...(boostedProductIds.length > 0 && {
              _id: { [Op.notIn]: boostedProductIds },
            }),
          },
          limit: regularProductsNeeded,
          offset: regularProductsSkip,
          order: this.productOrder(
            order ?? null,
            price ?? null,
            tag ?? null
          ),
          attributes: [...this.productAttributes],
          include: [
            {
              model: Store,
              required: true,
              attributes: [],
              where: { status: "approved" },
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

      /* ============================
      * FINAL RESPONSE
      * ============================ */
      const finalProducts = [...boostedForPage, ...regularProducts];
      const totalCount = totalBoosted + regularCount;

      return new DataResponseDto(
        finalProducts,
        true,
        "Successful",
        {
          page: safePage,
          take: safeTake,
        } as any,
        totalCount
      );
    } catch (err) {
      console.error("fetchProductsSingle error:", err);
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }
}
