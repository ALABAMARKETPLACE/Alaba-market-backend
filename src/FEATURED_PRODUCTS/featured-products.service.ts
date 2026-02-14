import {
  Injectable,
  Inject,
  HttpException,
  InternalServerErrorException,
} from "@nestjs/common";
import { Op } from "sequelize";
import { getErrorMessage } from "../shared/helpers/errormessage";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { BoostRequest } from "../BOOST_REQUESTS/boost-request.entity";
import { SubscriptionPlan } from "../SUBSCRIPTION_PLANS/subscription-plan.entity";
import { Products } from "../PRODUCTS/products.entity";
import { Store } from "../STORE/store.entity";
import { GetAllProductsDto } from "./dto/get-all-products.dto";
import { ProductVariant } from "../PRODUCT_VARIANTS/productvariant.entity";
import { FeaturedRotationState } from "./featured-rotation-state.entity";
import { GetPositionProductsDto } from "./dto/get-position-products.dto";

interface RotationContext {
  planName: string | null;
  totalBatches: number;
  queueLength: number;
  batchIndex: number;
}

interface RotateOptions {
  batchSize?: number;
  rotationMinutes?: number;
  force?: boolean;
  logContext?: string;
}

const DEFAULT_BATCH_SIZE = 5;
const ROTATION_MINUTES = 5;
const FALLBACK_FETCH_MULTIPLIER = 4;

@Injectable()
export class FeaturedProductsService {
  constructor(
    @Inject("BoostRequestRepository")
    private readonly boostRequestRepository: typeof BoostRequest,
    @Inject("SubscriptionPlanRepository")
    private readonly subscriptionPlanRepository: typeof SubscriptionPlan,
    @Inject("ProductsRepository")
    private readonly productsRepository: typeof Products,
    @Inject("StoreRepository")
    private readonly storeRepository: typeof Store,
    @Inject("FeaturedRotationStateRepository")
    private readonly rotationStateRepository: typeof FeaturedRotationState,
  ) {}

  async getProductsByPosition(
    position: number,
    batchSize: number = DEFAULT_BATCH_SIZE,
  ): Promise<DataResponseDto> {
    try {
      const rotationResult = await this.rotatePositionIfDue(position, {
        batchSize,
        rotationMinutes: ROTATION_MINUTES,
        force: false,
        logContext: "[API]",
      });

      const state = rotationResult.state;
      const activeIds = state.active_product_ids ?? [];

      if (!activeIds.length) {
        const emptyPageOptions = {
          page: 1,
          take: batchSize,
          offset: 0,
          limit: batchSize,
        };
        const emptyMessage = rotationResult.context.queueLength
          ? "Featured products queued but not ready yet"
          : "No featured products available";
        return new DataResponseDto(
          [],
          true,
          emptyMessage,
          emptyPageOptions as any,
          rotationResult.context.queueLength,
        );
      }

      const orderedProducts = await this.fetchProductsByIds(activeIds);

      // ✅ SORT: Electronics first, then others
      const sortedProducts = this.sortByElectronicsFirst(orderedProducts);

      const pageOptions = {
        page: rotationResult.context.batchIndex + 1,
        take: batchSize,
        offset: rotationResult.context.batchIndex * batchSize,
        limit: batchSize,
      };

      const response: any = new DataResponseDto(
        sortedProducts,
        // orderedProducts,
        true,
        "Successfull",
        pageOptions as any,
        rotationResult.context.queueLength,
      );

      response.rotation = {
        position,
        planName: rotationResult.context.planName,
        currentBatchIndex: rotationResult.context.batchIndex,
        queueLength: rotationResult.context.queueLength,
        totalBatches: rotationResult.context.totalBatches,
        nextRotationAt: state.next_rotation_at,
        fallbackCount: state.fallback_product_ids?.length ?? 0,
      };

      return response;
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async getAllProductsForPosition(
    position: number,
    query: GetPositionProductsDto,
  ): Promise<DataResponseDto> {
    try {
      const queueInfo = await this.buildQueueForPosition(position);
      const state = await this.getOrCreateRotationState(position);
      const queue = queueInfo.queueProductIds ?? [];

      if (!queue.length) {
        const emptyPageOptions: any = {
          page: query.page ?? 1,
          take: query.take ?? 20,
        };
        const payload = {
          position,
          planName: queueInfo.planName,
          total: 0,
          products: [],
          lastRotationAt: state.last_rotation_at,
          nextRotationAt: state.next_rotation_at,
        };
        return new DataResponseDto(
          payload,
          true,
          "No featured products available",
          emptyPageOptions,
          0,
        );
      }

      const page = query.page ?? 1;
      const take = query.take ?? 20;

      const products = await this.productsRepository.findAll({
        where: {
          _id: {
            [Op.in]: queue,
          },
        },
        include: [
          {
            model: ProductVariant,
            as: "productVariant",
            required: false,
            attributes: ["price", "id", "image"],
          },
          {
            model: Store,
            as: "storeDetails",
            required: false,
            attributes: ["id", "name"],
          },
        ],
      });

      const orderMap = new Map<number, number>();
      queue.forEach((id, index) => orderMap.set(id, index));

      // const filteredProducts = products
      //   .filter((product: any) => {
      //     if (!product) return false;

      //     if (
      //       query.store_id &&
      //       Number(product.store_id) !== Number(query.store_id)
      //     ) {
      //       return false;
      //     }

      //     if (query.status !== undefined) {
      //       const statusBool = Number(query.status) === 1;
      //       if (Boolean(product.status) !== statusBool) {
      //         return false;
      //       }
      //     }

      //     if (
      //       query.min_price !== undefined &&
      //       Number(product.price ?? 0) < Number(query.min_price)
      //     ) {
      //       return false;
      //     }

      //     if (
      //       query.max_price !== undefined &&
      //       Number(product.price ?? 0) > Number(query.max_price)
      //     ) {
      //       return false;
      //     }

      //     if (query.search) {
      //       const term = query.search.toLowerCase();
      //       const matchesName = product.name?.toLowerCase().includes(term);
      //       const matchesSku = product.sku?.toLowerCase().includes(term);
      //       const matchesBrand = product.brand?.toLowerCase().includes(term);
      //       if (!matchesName && !matchesSku && !matchesBrand) {
      //         return false;
      //       }
      //     }

      //     return true;
      //   })
      //   .sort((a: any, b: any) => {
      //     const indexA = orderMap.get(a._id) ?? Number.MAX_SAFE_INTEGER;
      //     const indexB = orderMap.get(b._id) ?? Number.MAX_SAFE_INTEGER;
      //     return indexA - indexB;
      //   });

      // electronics feature products setup below:
      const filteredProducts = products
        .filter((product: any) => {
          if (!product) return false;

          // ✅ NEW: Filter by electronics_only
          if (query.electronics_only && !this.isElectronicsProduct(product)) {
            return false;
          }

          // ✅ NEW: Filter by category
          if (query.category) {
            const productCategory = product.category?.toLowerCase() || "";
            const queryCategory = query.category.toLowerCase();
            if (!productCategory.includes(queryCategory)) {
              return false;
            }
          }

          if (
            query.store_id &&
            Number(product.store_id) !== Number(query.store_id)
          ) {
            return false;
          }

          if (query.status !== undefined) {
            const statusBool = Number(query.status) === 1;
            if (Boolean(product.status) !== statusBool) {
              return false;
            }
          }

          if (
            query.min_price !== undefined &&
            Number(product.price ?? 0) < Number(query.min_price)
          ) {
            return false;
          }

          if (
            query.max_price !== undefined &&
            Number(product.price ?? 0) > Number(query.max_price)
          ) {
            return false;
          }

          if (query.search) {
            const term = query.search.toLowerCase();
            const matchesName = product.name?.toLowerCase().includes(term);
            const matchesSku = product.sku?.toLowerCase().includes(term);
            const matchesBrand = product.brand?.toLowerCase().includes(term);
            if (!matchesName && !matchesSku && !matchesBrand) {
              return false;
            }
          }

          return true;
        })
        .sort((a: any, b: any) => {
          // ✅ PRIORITY 1: Electronics come first
          const aIsElectronics = this.isElectronicsProduct(a);
          const bIsElectronics = this.isElectronicsProduct(b);

          if (aIsElectronics && !bIsElectronics) return -1;
          if (!aIsElectronics && bIsElectronics) return 1;

          // ✅ PRIORITY 2: If both are same category type, sort by queue position
          const indexA = orderMap.get(a._id) ?? Number.MAX_SAFE_INTEGER;
          const indexB = orderMap.get(b._id) ?? Number.MAX_SAFE_INTEGER;
          return indexA - indexB;
        });

      const totalFiltered = filteredProducts.length;
      const start = (page - 1) * take;
      const paginatedProducts = filteredProducts.slice(start, start + take);

      let fallbackProducts: any[] = [];

      if (position !== 1 && page === 1 && paginatedProducts.length < take) {
        const excludeIds = new Set<number>(queue);
        paginatedProducts.forEach((product: any) => {
          if (product?._id) {
            excludeIds.add(product._id);
          }
        });

        const fallbackIds = await this.fetchRecentFallbackIds(
          excludeIds,
          take - paginatedProducts.length,
        );

        if (fallbackIds.length) {
          const fallbackDetails = await this.fetchProductsByIds(fallbackIds);
          fallbackProducts = fallbackDetails.filter((product: any) => {
            if (!product?._id) return false;

            // ✅ NEW: Filter by electronics_only
            if (query.electronics_only && !this.isElectronicsProduct(product)) {
              return false;
            }

            // ✅ NEW: Filter by category
            if (query.category) {
              const productCategory = product.category?.toLowerCase() || "";
              const queryCategory = query.category.toLowerCase();
              if (!productCategory.includes(queryCategory)) {
                return false;
              }
            }

            if (
              query.store_id &&
              Number(product.store_id) !== Number(query.store_id)
            ) {
              return false;
            }

            if (query.status !== undefined) {
              const statusBool = Number(query.status) === 1;
              if (Boolean(product.status) !== statusBool) {
                return false;
              }
            }

            if (
              query.min_price !== undefined &&
              Number(product.price ?? 0) < Number(query.min_price)
            ) {
              return false;
            }

            if (
              query.max_price !== undefined &&
              Number(product.price ?? 0) > Number(query.max_price)
            ) {
              return false;
            }

            if (query.search) {
              const term = query.search.toLowerCase();
              const matchesName = product.name?.toLowerCase().includes(term);
              const matchesSku = product.sku?.toLowerCase().includes(term);
              const matchesBrand = product.brand?.toLowerCase().includes(term);
              if (!matchesName && !matchesSku && !matchesBrand) {
                return false;
              }
            }

            return true;
          });

          // ✅ Sort fallback products by electronics first
          fallbackProducts = this.sortByElectronicsFirst(fallbackProducts);
        }

        // if (fallbackIds.length) {
        //   const fallbackDetails = await this.fetchProductsByIds(fallbackIds);
        //   fallbackProducts = fallbackDetails.filter((product: any) => {
        //     if (!product?._id) return false;

        //     if (
        //       query.store_id &&
        //       Number(product.store_id) !== Number(query.store_id)
        //     ) {
        //       return false;
        //     }

        //     if (query.status !== undefined) {
        //       const statusBool = Number(query.status) === 1;
        //       if (Boolean(product.status) !== statusBool) {
        //         return false;
        //       }
        //     }

        //     if (
        //       query.min_price !== undefined &&
        //       Number(product.price ?? 0) < Number(query.min_price)
        //     ) {
        //       return false;
        //     }

        //     if (
        //       query.max_price !== undefined &&
        //       Number(product.price ?? 0) > Number(query.max_price)
        //     ) {
        //       return false;
        //     }

        //     if (query.search) {
        //       const term = query.search.toLowerCase();
        //       const matchesName = product.name?.toLowerCase().includes(term);
        //       const matchesSku = product.sku?.toLowerCase().includes(term);
        //       const matchesBrand = product.brand?.toLowerCase().includes(term);
        //       if (!matchesName && !matchesSku && !matchesBrand) {
        //         return false;
        //       }
        //     }

        //     return true;
        //   });

        //   // ✅ ADD THIS: Sort fallback products by electronics first
        //   fallbackProducts = this.sortByElectronicsFirst(fallbackProducts);
        // }
      }

      const payload = {
        position,
        planName: queueInfo.planName,
        total: totalFiltered + fallbackProducts.length,
        products: [...paginatedProducts, ...fallbackProducts],
        lastRotationAt: state.last_rotation_at,
        nextRotationAt: state.next_rotation_at,
      };

      const pageOptions: any = {
        page,
        take,
      };

      return new DataResponseDto(
        payload,
        true,
        "Successfull",
        pageOptions,
        totalFiltered + fallbackProducts.length,
      );
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async rotatePositionIfDue(
    position: number,
    options: RotateOptions = {},
  ): Promise<{
    rotated: boolean;
    state: FeaturedRotationState;
    context: RotationContext;
  }> {
    const batchSize = options.batchSize ?? DEFAULT_BATCH_SIZE;
    const rotationMinutes = options.rotationMinutes ?? ROTATION_MINUTES;
    const force = options.force ?? false;
    const now = new Date();

    const state = await this.getOrCreateRotationState(position);
    const queueInfo = await this.buildQueueForPosition(position);
    const queue = queueInfo.queueProductIds;
    const queueChanged = !this.isSameQueue(
      queue,
      state.queue_product_ids ?? [],
    );

    const batchSizeChanged =
      (state.active_product_ids?.length ?? 0) !== batchSize;

    const shouldRotate =
      force ||
      queueChanged ||
      batchSizeChanged ||
      !state.next_rotation_at ||
      state.next_rotation_at <= now;

    const totalBatchesForContext = queue.length
      ? Math.max(1, Math.ceil(queue.length / batchSize))
      : 0;

    if (!shouldRotate) {
      return {
        rotated: false,
        state,
        context: {
          planName: queueInfo.planName,
          totalBatches: totalBatchesForContext,
          queueLength: queue.length,
          batchIndex: state.current_batch_index ?? 0,
        },
      };
    }

    console.log(
      "[FeaturedProducts] Rotation start=======================",
      JSON.stringify({
        context: options.logContext ?? "[Service]",
        position,
        queueLength: queue.length,
        planName: queueInfo.planName,
        queueProductIds: queue,
        timestamp: now.toISOString(),
      }),
      "everythign is end and you can ",
    );

    let activeIds: number[] = [];
    let fallbackIds: number[] = [];
    let totalBatches = totalBatchesForContext;
    let nextBatchIndex = 0;

    if (queue.length > 0) {
      totalBatches = Math.max(1, Math.ceil(queue.length / batchSize));
      nextBatchIndex = queueChanged
        ? 0
        : (state.current_batch_index + 1) % totalBatches;

      const baseIds = this.buildBatch(queue, batchSize, nextBatchIndex);
      const exclude = new Set(baseIds);

      if (position !== 1 && baseIds.length < batchSize) {
        fallbackIds = await this.fetchRecentFallbackIds(
          exclude,
          batchSize - baseIds.length,
        );
      }

      activeIds = [...baseIds, ...fallbackIds].slice(0, batchSize);
    } else {
      if (position !== 1) {
        fallbackIds = await this.fetchRecentFallbackIds(
          new Set<number>(),
          batchSize,
        );
        activeIds = fallbackIds.slice(0, batchSize);
      } else {
        activeIds = [];
      }
      totalBatches = 0;
      nextBatchIndex = 0;
    }

    state.queue_product_ids = queue;
    state.total_products = queue.length;
    state.current_batch_index = nextBatchIndex;
    state.active_product_ids = activeIds;
    state.fallback_product_ids = fallbackIds;
    state.last_rotation_at = now;
    state.next_rotation_at = new Date(
      now.getTime() + rotationMinutes * 60 * 1000,
    );
    if (queueChanged || !state.queue_refreshed_at) {
      state.queue_refreshed_at = now;
    }

    await state.save();

    console.log(
      "[FeaturedProducts] Rotation complete",
      JSON.stringify({
        context: options.logContext ?? "[Service]",
        position,
        queueLength: queue.length,
        totalBatches,
        batchIndex: nextBatchIndex,
        activeIds,
        fallbackIds,
        queueProductIds: queue,
        nextRotationAt: state.next_rotation_at?.toISOString() ?? null,
        timestamp: new Date().toISOString(),
      }),
      "=============================end========================",
    );

    return {
      rotated: true,
      state,
      context: {
        planName: queueInfo.planName,
        totalBatches,
        queueLength: queue.length,
        batchIndex: nextBatchIndex,
      },
    };
  }

  // elelctronic preference category starts here

  private readonly ELECTRONICS_CATEGORIES = [
    "Electronics",
    "electronics",
    "Mobile Phones",
    "Computers",
    "Laptops",
    "Tablets",
    "Cameras",
    "Audio",
    "Television",
    "Smart Watches",
    "Gaming",
    "Computer Accessories",
    "Phone Accessories",
  ];

  private isElectronicsProduct(product: any): boolean {
    if (!product) return false;
    // const category = product.category?.toLowerCase() || "";
    // const subCategory = product.subCategory?.toLowerCase() || "";
    // const name = product.name?.toLowerCase() || "";
    //
    const category = (product?.category || "").toString().toLowerCase();
    const subCategory = (product?.subCategory || "").toString().toLowerCase();
    const name = (product?.name || "").toString().toLowerCase();

    const electronicsKeywords = [
      "electronics",
      "electronic",
      "electric",
      "electronical",
      "electricals",
      "electrical",
      "phone",
      "phones",
      "computer",
      "laptop",
      "tablet",
      "camera",
      "television",
      "tv",
      "audio",
      "speaker",
      "headphone",
      "gaming",
      "console",
      "solar",
      "battery",
      "smart watch",
    ];

    // Check if category matches
    if (
      this.ELECTRONICS_CATEGORIES.some(
        (cat) =>
          category.includes(cat.toLowerCase()) ||
          subCategory.includes(cat.toLowerCase()),
      )
    ) {
      return true;
    }

    // Check if name contains electronics keywords
    return electronicsKeywords.some(
      (keyword) =>
        name.includes(keyword) ||
        category.includes(keyword) ||
        subCategory.includes(keyword),
    );
  }

  private sortByElectronicsFirst(products: any[]): any[] {
    return products.sort((a, b) => {
      const aIsElectronics = this.isElectronicsProduct(a);
      const bIsElectronics = this.isElectronicsProduct(b);

      // Electronics products come first
      if (aIsElectronics && !bIsElectronics) return -1;
      if (!aIsElectronics && bIsElectronics) return 1;

      // If both are electronics or both are not, maintain original order (by createdAt DESC)
      return 0;
    });
  }

  // electronics preference category setup ends here

  private async getOrCreateRotationState(
    position: number,
  ): Promise<FeaturedRotationState> {
    const existing = await this.rotationStateRepository.findByPk(position);
    if (existing) {
      return existing;
    }
    return this.rotationStateRepository.create({
      position,
      current_batch_index: 0,
      total_products: 0,
      queue_product_ids: [],
      active_product_ids: [],
      fallback_product_ids: [],
      next_rotation_at: null,
      last_rotation_at: null,
      queue_refreshed_at: null,
    } as any);
  }

  private async buildQueueForPosition(position: number): Promise<{
    queueProductIds: number[];
    totalProducts: number;
    planName: string | null;
  }> {
    const plan = await this.subscriptionPlanRepository.findOne({
      where: {
        featured_position: position,
        is_active: true,
      },
    });

    if (!plan) {
      return { queueProductIds: [], totalProducts: 0, planName: null };
    }

    const boostRequests = await this.boostRequestRepository.findAll({
      where: {
        status: "approved",
        plan_id: plan.id,
      },
      order: [
        ["boost_priority", "ASC"],
        ["approved_at", "ASC"],
      ],
    });

    const now = new Date();
    const queueProductIds: number[] = [];
    const seenIds = new Set<number>();

    // Filter active boosts: approved_at <= now AND approved_at + days > now
    const activeBoosts = boostRequests.filter((br: any) => {
      if (!br.approved_at) return false;

      const approvedDate = new Date(br.approved_at);
      const endDate = new Date(approvedDate);
      endDate.setDate(endDate.getDate() + br.days);

      return approvedDate <= now && endDate > now;
    });

    activeBoosts.forEach((br) => {
      (br.product_ids || []).forEach((pid) => {
        if (!seenIds.has(pid)) {
          queueProductIds.push(pid);
          seenIds.add(pid);
        }
      });
    });

    return {
      queueProductIds,
      totalProducts: queueProductIds.length,
      planName: plan.name ?? null,
    };
  }

  private buildBatch(
    queue: number[],
    batchSize: number,
    batchIndex: number,
  ): number[] {
    if (!queue.length) {
      return [];
    }

    const totalProducts = queue.length;
    const totalBatches = Math.max(1, Math.ceil(totalProducts / batchSize));
    const normalizedBatchIndex =
      ((batchIndex % totalBatches) + totalBatches) % totalBatches;
    const startIndex = normalizedBatchIndex * batchSize;

    let ids = queue.slice(startIndex, startIndex + batchSize);
    if (ids.length < batchSize) {
      ids = ids.concat(queue.slice(0, batchSize - ids.length));
    }

    const uniqueIds: number[] = [];
    const seen = new Set<number>();
    ids.forEach((id) => {
      if (!seen.has(id)) {
        seen.add(id);
        uniqueIds.push(id);
      }
    });

    return uniqueIds;
  }

  private async fetchRecentFallbackIds(
    excludeIds: Set<number>,
    limit: number,
  ): Promise<number[]> {
    if (limit <= 0) {
      return [];
    }

    const candidates = await this.productsRepository.findAll({
      order: [["createdAt", "DESC"]],
      limit: limit * FALLBACK_FETCH_MULTIPLIER,
      attributes: ["_id"],
    });

    const fallbackIds: number[] = [];
    for (const product of candidates) {
      const productId = (product as any)?._id;
      if (!productId) continue;
      if (excludeIds.has(productId)) continue;

      fallbackIds.push(productId);
      excludeIds.add(productId);

      if (fallbackIds.length >= limit) {
        break;
      }
    }

    return fallbackIds;
  }

  private async fetchProductsByIds(ids: number[]) {
    if (!ids.length) {
      return [];
    }

    const products = await this.productsRepository.findAll({
      where: { _id: { [Op.in]: ids } },
      include: [
        {
          model: ProductVariant,
          as: "productVariant",
          required: false,
          attributes: ["price", "id", "image"],
        },
      ],
    });

    const map = new Map<number, any>();
    products.forEach((product: any) => {
      map.set(product?._id ?? product?.id, product);
    });

    return ids
      .map((id) => map.get(id))
      .filter((product) => product !== undefined && product !== null);
  }

  private isSameQueue(a: number[], b: number[]): boolean {
    if (a.length !== b.length) {
      return false;
    }
    for (let i = 0; i < a.length; i += 1) {
      if (a[i] !== b[i]) {
        return false;
      }
    }
    return true;
  }

  // Get all products with pagination and filters
  async getAllProducts(query: GetAllProductsDto): Promise<DataResponseDto> {
    try {
      console.log(
        "[FeaturedProducts.getAllProducts] Incoming query:",
        JSON.stringify(query, null, 2),
      );

      const {
        search,
        category,
        subCategory,
        store_id,
        status,
        min_price,
        max_price,
        stock_status,
      } = query;

      // Build where clause
      const whereClause: any = {};

      // Filter by category
      if (category) {
        whereClause.category = category;
      }

      if (stock_status === "instock") {
        whereClause.unit = { [Op.gt]: 0 };
      } else if (stock_status === "out_of_stock") {
        whereClause.unit = { [Op.lte]: 0 };
      }

      // Filter by subcategory
      if (subCategory) {
        whereClause.subCategory = subCategory;
      }

      // Filter by store/seller
      if (store_id) {
        console.log(
          "[FeaturedProducts.getAllProducts] Processing store_id:",
          store_id,
          "Type:",
          typeof store_id,
        );
        const normalizedStoreId = Number(store_id);
        const storeFilter = Number.isNaN(normalizedStoreId)
          ? null
          : normalizedStoreId;

        console.log(
          "[FeaturedProducts.getAllProducts] Normalized store_id:",
          storeFilter,
        );

        if (!storeFilter) {
          console.log(
            "[FeaturedProducts.getAllProducts] Invalid store_id, returning empty result",
          );
          return new DataResponseDto([], true, "Successfull", query, 0);
        }

        const storeRecord = await this.storeRepository.findByPk(storeFilter, {
          attributes: ["id", "store_name", "status"],
        });

        if (!storeRecord) {
          console.warn(
            "[FeaturedProducts.getAllProducts] No store found for id",
            storeFilter,
          );
          return new DataResponseDto([], true, "Successfull", query, 0);
        }

        console.log(
          "[FeaturedProducts.getAllProducts] Store record:",
          JSON.stringify(storeRecord.toJSON(), null, 2),
        );

        whereClause.store_id = storeFilter;
        console.log(
          "[FeaturedProducts.getAllProducts] Added store_id to whereClause:",
          whereClause.store_id,
        );
      }

      // Filter by status
      if (status !== undefined) {
        whereClause.status = status;
      }

      // Filter by price range
      if (min_price !== undefined || max_price !== undefined) {
        whereClause.price = {};
        if (min_price !== undefined) {
          whereClause.price[Op.gte] = min_price;
        }
        if (max_price !== undefined) {
          whereClause.price[Op.lte] = max_price;
        }
      }

      // Search by name, sku, or brand
      if (search) {
        whereClause[Op.or] = [
          {
            name: {
              [Op.like]: `%${search}%`,
            },
          },
          {
            sku: {
              [Op.like]: `%${search}%`,
            },
          },
          {
            brand: {
              [Op.like]: `%${search}%`,
            },
          },
        ];
      }

      console.log(
        "[FeaturedProducts.getAllProducts] Final whereClause:",
        JSON.stringify(whereClause, null, 2),
      );

      const findOptions: any = {
        where: whereClause,
        include: [
          {
            model: ProductVariant,
            as: "productVariant",
            required: false,
            attributes: ["price", "id", "image"],
          },
        ],
        order: [["createdAt", "DESC"]],
        limit: query.limit,
        offset: query.offset,
        distinct: true,
      };

      if (store_id) {
        const storeInclude = {
          model: Store,
          as: "storeDetails",
          required: true,
          attributes: ["id", "name", "slug", "status"],
          where: {
            id: Number(store_id),
          },
        };
        findOptions.include.push(storeInclude);
        console.log(
          "[FeaturedProducts.getAllProducts] Added Store include with filter:",
          JSON.stringify(storeInclude.where, null, 2),
        );
      }

      console.log(
        "[FeaturedProducts.getAllProducts] Executing query with options:",
        JSON.stringify(
          {
            where: findOptions.where,
            includeCount: findOptions.include.length,
            limit: findOptions.limit,
            offset: findOptions.offset,
          },
          null,
          2,
        ),
      );

      const { count, rows } = await this.productsRepository.findAndCountAll(
        findOptions,
      );

      // console.log(
      //   "[FeaturedProducts.getAllProducts] Query results - Count:",
      //   count,
      //   "Rows:",
      //   rows.length,
      // );
      // if (rows.length > 0) {
      //   console.log(
      //     "[FeaturedProducts.getAllProducts] First product sample:",
      //     JSON.stringify(
      //       {
      //         _id: rows[0]?._id,
      //         name: rows[0]?.name,
      //         store_id: rows[0]?.store_id,
      //         status: rows[0]?.status,
      //       },
      //       null,
      //       2,
      //     ),
      //   );
      // }

      // ✅ SORT: Electronics first
      const sortedRows = this.sortByElectronicsFirst(rows);

      console.log(
        "[FeaturedProducts.getAllProducts] Query results - Count:",
        count,
        "Rows:",
        sortedRows.length,
      );
      if (sortedRows.length > 0) {
        console.log(
          "[FeaturedProducts.getAllProducts] First product sample:",
          JSON.stringify(
            {
              _id: sortedRows[0]?._id,
              name: sortedRows[0]?.name,
              store_id: sortedRows[0]?.store_id,
              status: sortedRows[0]?.status,
            },
            null,
            2,
          ),
        );
      }

      // Return raw products with meta pagination (like product_search_single)
      // return new DataResponseDto(rows, true, "Successfull", query, count);

      // ✅ SORT: Electronics first
      return new DataResponseDto(sortedRows, true, "Successfull", query, count);
    } catch (err) {
      console.error(
        "[FeaturedProducts.getAllProducts] Error occurred:",
        err?.message || err,
      );
      console.error(
        "[FeaturedProducts.getAllProducts] Error stack:",
        err?.stack,
      );
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }
}
