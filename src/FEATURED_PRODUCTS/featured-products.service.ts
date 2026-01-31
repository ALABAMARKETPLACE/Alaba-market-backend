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
import { PageOptionsDto } from "../shared/dto/pageOptions.dto";

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
    private readonly rotationStateRepository: typeof FeaturedRotationState
  ) {}

  async getProductsByPosition(
    position: number,
    batchSize: number = DEFAULT_BATCH_SIZE
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
          rotationResult.context.queueLength
        );
      }

      const orderedProducts = await this.fetchProductsByIds(activeIds);

      const pageOptions = {
        page: rotationResult.context.batchIndex + 1,
        take: batchSize,
        offset: rotationResult.context.batchIndex * batchSize,
        limit: batchSize,
      };

      const response: any = new DataResponseDto(
        orderedProducts,
        true,
        "Successfull",
        pageOptions as any,
        rotationResult.context.queueLength
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

  // async getAllProductsForPosition(
  //   position: number,
  //   query: GetPositionProductsDto
  // ): Promise<DataResponseDto> {
  //   try {
  //     const queueInfo = await this.buildQueueForPosition(position);
  //     const state = await this.getOrCreateRotationState(position);
  //     const queue = queueInfo.queueProductIds ?? [];

  //     if (!queue.length) {
  //       const emptyPageOptions: any = {
  //         page: query.page ?? 1,
  //         take: query.take ?? 20,
  //       };
  //       const payload = {
  //         position,
  //         planName: queueInfo.planName,
  //         total: 0,
  //         products: [],
  //         lastRotationAt: state.last_rotation_at,
  //         nextRotationAt: state.next_rotation_at,
  //       };
  //       return new DataResponseDto(
  //         payload,
  //         true,
  //         "No featured products available",
  //         emptyPageOptions,
  //         0
  //       );
  //     }

  //     const page = query.page ?? 1;
  //     const take = query.take ?? 20;

  //     const products = await this.productsRepository.findAll({
  //       where: {
  //         _id: {
  //           [Op.in]: queue,
  //         },
  //       },
  //       include: [
  //         {
  //           model: ProductVariant,
  //           as: "productVariant",
  //           required: false,
  //           attributes: ["price", "id", "image"],
  //         },
  //         {
  //           model: Store,
  //           as: "storeDetails",
  //           required: false,
  //           attributes: ["id", "name"],
  //         },
  //       ],
  //     });

  //     const orderMap = new Map<number, number>();
  //     queue.forEach((id, index) => orderMap.set(id, index));

  //     const filteredProducts = products
  //       .filter((product: any) => {
  //         if (!product) return false;

  //         if (
  //           query.store_id &&
  //           Number(product.store_id) !== Number(query.store_id)
  //         ) {
  //           return false;
  //         }

  //         if (query.status !== undefined) {
  //           const statusBool = Number(query.status) === 1;
  //           if (Boolean(product.status) !== statusBool) {
  //             return false;
  //           }
  //         }

  //         if (
  //           query.min_price !== undefined &&
  //           Number(product.price ?? 0) < Number(query.min_price)
  //         ) {
  //           return false;
  //         }

  //         if (
  //           query.max_price !== undefined &&
  //           Number(product.price ?? 0) > Number(query.max_price)
  //         ) {
  //           return false;
  //         }

  //         if (query.search) {
  //           const term = query.search.toLowerCase();
  //           const matchesName = product.name?.toLowerCase().includes(term);
  //           const matchesSku = product.sku?.toLowerCase().includes(term);
  //           const matchesBrand = product.brand?.toLowerCase().includes(term);
  //           if (!matchesName && !matchesSku && !matchesBrand) {
  //             return false;
  //           }
  //         }

  //         return true;
  //       })
  //       .sort((a: any, b: any) => {
  //         const indexA = orderMap.get(a._id) ?? Number.MAX_SAFE_INTEGER;
  //         const indexB = orderMap.get(b._id) ?? Number.MAX_SAFE_INTEGER;
  //         return indexA - indexB;
  //       });

  //     const totalFiltered = filteredProducts.length;
  //     const start = (page - 1) * take;
  //     const paginatedProducts = filteredProducts.slice(start, start + take);

  //     let fallbackProducts: any[] = [];

  //     if (position !== 1 && page === 1 && paginatedProducts.length < take) {
  //       const excludeIds = new Set<number>(queue);
  //       paginatedProducts.forEach((product: any) => {
  //         if (product?._id) {
  //           excludeIds.add(product._id);
  //         }
  //       });

  //       const fallbackIds = await this.fetchRecentFallbackIds(
  //         excludeIds,
  //         take - paginatedProducts.length
  //       );

  //       if (fallbackIds.length) {
  //         const fallbackDetails = await this.fetchProductsByIds(fallbackIds);
  //         fallbackProducts = fallbackDetails.filter((product: any) => {
  //           if (!product?._id) return false;

  //           if (
  //             query.store_id &&
  //             Number(product.store_id) !== Number(query.store_id)
  //           ) {
  //             return false;
  //           }

  //           if (query.status !== undefined) {
  //             const statusBool = Number(query.status) === 1;
  //             if (Boolean(product.status) !== statusBool) {
  //               return false;
  //             }
  //           }

  //           if (
  //             query.min_price !== undefined &&
  //             Number(product.price ?? 0) < Number(query.min_price)
  //           ) {
  //             return false;
  //           }

  //           if (
  //             query.max_price !== undefined &&
  //             Number(product.price ?? 0) > Number(query.max_price)
  //           ) {
  //             return false;
  //           }

  //           if (query.search) {
  //             const term = query.search.toLowerCase();
  //             const matchesName = product.name?.toLowerCase().includes(term);
  //             const matchesSku = product.sku?.toLowerCase().includes(term);
  //             const matchesBrand = product.brand?.toLowerCase().includes(term);
  //             if (!matchesName && !matchesSku && !matchesBrand) {
  //               return false;
  //             }
  //           }

  //           return true;
  //         });
  //       }
  //     }

  //     const payload = {
  //       position,
  //       planName: queueInfo.planName,
  //       total: totalFiltered + fallbackProducts.length,
  //       products: [...paginatedProducts, ...fallbackProducts],
  //       lastRotationAt: state.last_rotation_at,
  //       nextRotationAt: state.next_rotation_at,
  //     };

  //     const pageOptions: any = {
  //       page,
  //       take,
  //     };

  //     return new DataResponseDto(
  //       payload,
  //       true,
  //       "Successfull",
  //       pageOptions,
  //       totalFiltered + fallbackProducts.length
  //     );
  //   } catch (err) {
  //     if (err instanceof HttpException) throw err;
  //     throw new InternalServerErrorException(getErrorMessage(err));
  //   }
  // }

async getAllProductsForPosition(
  position: number,
  query: GetPositionProductsDto
): Promise<DataResponseDto> {
  try {
    const queueInfo = await this.buildQueueForPosition(position);
    const state = await this.getOrCreateRotationState(position);
    const originalQueue = queueInfo.queueProductIds ?? [];

    const page = query.page ?? 1;
    const take = query.take ?? 20;

    if (!originalQueue.length) {
      return new DataResponseDto(
        {
          position,
          planName: queueInfo.planName,
          total: 0,
          products: [],
          lastRotationAt: state.last_rotation_at,
          nextRotationAt: state.next_rotation_at,
        },
        true,
        "No featured products available",
        query, // ✅ FIX
        0
      );
    }

    const products = await this.productsRepository.findAll({
      where: {
        _id: { [Op.in]: originalQueue },
        status: true,
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
          required: true,
          attributes: ["id", "name", "status"],
          where: { status: true },
        },
      ],
    });

    const foundIdSet = new Set(products.map((p: any) => p._id));
    const validQueue = originalQueue.filter((id) => foundIdSet.has(id));

    if (!validQueue.length) {
      return new DataResponseDto(
        {
          position,
          planName: queueInfo.planName,
          total: 0,
          products: [],
          lastRotationAt: state.last_rotation_at,
          nextRotationAt: state.next_rotation_at,
        },
        true,
        "No active featured products",
        query, // ✅ FIX
        0
      );
    }

    const orderMap = new Map<number, number>();
    validQueue.forEach((id, index) => orderMap.set(id, index));

    let filteredProducts = products
      .filter((product: any) => {
        if (!product) return false;

        if (
          query.store_id &&
          Number(product.store_id) !== Number(query.store_id)
        ) {
          return false;
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
          if (
            !product.name?.toLowerCase().includes(term) &&
            !product.sku?.toLowerCase().includes(term) &&
            !product.brand?.toLowerCase().includes(term)
          ) {
            return false;
          }
        }

        return true;
      })
      .sort(
        (a: any, b: any) =>
          (orderMap.get(a._id) ?? Number.MAX_SAFE_INTEGER) -
          (orderMap.get(b._id) ?? Number.MAX_SAFE_INTEGER)
      );

    filteredProducts = filteredProducts
      .map((p) => ({ p, r: Math.random() }))
      .sort((a, b) => a.r - b.r)
      .map(({ p }) => p);

    const totalFiltered = filteredProducts.length;
    const start = (page - 1) * take;
    const paginatedProducts = filteredProducts.slice(start, start + take);

    let fallbackProducts: any[] = [];

    if (page === 1 && paginatedProducts.length < take) {
      const excludeIds = new Set<number>(
        paginatedProducts.map((p: any) => p._id)
      );

      const seed = Date.now() % 100000;

      const fallbackCandidates = await this.productsRepository.findAll({
        where: {
          status: true,
          _id: { [Op.notIn]: Array.from(excludeIds) },
        },
        order: this.productsRepository.sequelize!.literal(
          `MOD("_id" + ${seed}, 100000)`
        ),
        limit: take * 3,
        include: [
          {
            model: Store,
            as: "storeDetails",
            required: true,
            where: { status: true },
          },
        ],
      });

      fallbackProducts = fallbackCandidates.slice(
        0,
        take - paginatedProducts.length
      );
    }

    const finalProducts = [...paginatedProducts, ...fallbackProducts];
    const total = totalFiltered + fallbackProducts.length;

    return new DataResponseDto(
      {
        position,
        planName: queueInfo.planName,
        total,
        products: finalProducts,
        lastRotationAt: state.last_rotation_at,
        nextRotationAt: state.next_rotation_at,
      },
      true,
      "Successfull",
      query, // ✅ FIX
      total
    );
  } catch (err) {
    if (err instanceof HttpException) throw err;
    throw new InternalServerErrorException(getErrorMessage(err));
  }
}


  async rotatePositionIfDue(
  position: number,
  options: RotateOptions = {}
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
  let queue = queueInfo.queueProductIds ?? [];

  /**
   * 🔀 FIX 1: Shuffle queue ONCE per rotation window
   */
  const shouldShuffle =
    force ||
    !state.queue_refreshed_at ||
    state.queue_refreshed_at <= new Date(
      now.getTime() - rotationMinutes * 60 * 1000
    );

  if (shouldShuffle && queue.length > 1) {
    queue = queue
      .map((id) => ({ id, r: Math.random() }))
      .sort((a, b) => a.r - b.r)
      .map(({ id }) => id);
  }

  const queueChanged = !this.isSameQueue(
    queue,
    state.queue_product_ids ?? []
  );

  const batchSizeChanged =
    (state.active_product_ids?.length ?? 0) !== batchSize;

  const shouldRotate =
    force ||
    queueChanged ||
    batchSizeChanged ||
    !state.next_rotation_at ||
    state.next_rotation_at <= now;

  const totalBatches = queue.length
    ? Math.max(1, Math.ceil(queue.length / batchSize))
    : 0;

  if (!shouldRotate) {
    return {
      rotated: false,
      state,
      context: {
        planName: queueInfo.planName,
        totalBatches,
        queueLength: queue.length,
        batchIndex: state.current_batch_index ?? 0,
      },
    };
  }

  /**
   * 🔁 FIX 2: Rotate batch fairly
   */
  const nextBatchIndex =
    totalBatches > 0
      ? (state.current_batch_index + 1) % totalBatches
      : 0;

  const baseIds = this.buildBatch(queue, batchSize, nextBatchIndex);

  /**
   * 🎯 FIX 3: Random fallback (NOT newest-first)
   */
  let fallbackIds: number[] = [];
  if (position !== 1 && baseIds.length < batchSize) {
    fallbackIds = await this.fetchRandomFallbackIds(
      new Set(baseIds),
      batchSize - baseIds.length
    );
  }

  const activeIds = [...baseIds, ...fallbackIds].slice(0, batchSize);

  state.queue_product_ids = queue;
  state.total_products = queue.length;
  state.current_batch_index = nextBatchIndex;
  state.active_product_ids = activeIds;
  state.fallback_product_ids = fallbackIds;
  state.last_rotation_at = now;
  state.next_rotation_at = new Date(
    now.getTime() + rotationMinutes * 60 * 1000
  );
  state.queue_refreshed_at = now;

  await state.save();

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

  private async getOrCreateRotationState(
    position: number
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
    batchIndex: number
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
    limit: number
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

  private async fetchRandomFallbackIds(
  excludeIds: Set<number>,
  limit: number
): Promise<number[]> {
  if (limit <= 0) return [];

  const seed = Date.now() % 100000;

  const products = await this.productsRepository.findAll({
    where: {
      status: true,
      _id: { [Op.notIn]: Array.from(excludeIds) },
    },
    order: this.productsRepository.sequelize!.literal(
      `MOD("_id" + ${seed}, 100000)`
    ),
    limit: limit * 3,
    attributes: ["_id"],
  });

  return products.slice(0, limit).map((p: any) => p._id);
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
    const {
      search,
      category,
      subCategory,
      store_id,
      min_price,
      max_price,
      stock_status,
    } = query;

    const whereClause: any = {
      status: true, // ✅ only active products
    };

    if (category) whereClause.category = category;
    if (subCategory) whereClause.subCategory = subCategory;

    if (stock_status === "instock") {
      whereClause.unit = { [Op.gt]: 0 };
    } else if (stock_status === "out_of_stock") {
      whereClause.unit = { [Op.lte]: 0 };
    }

    if (store_id) {
      whereClause.store_id = Number(store_id);
    }

    if (min_price !== undefined || max_price !== undefined) {
      whereClause.price = {};
      if (min_price !== undefined) whereClause.price[Op.gte] = min_price;
      if (max_price !== undefined) whereClause.price[Op.lte] = max_price;
    }

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { sku: { [Op.like]: `%${search}%` } },
        { brand: { [Op.like]: `%${search}%` } },
      ];
    }

    // ✅ SEEDED RANDOM (stable but shuffled)
    const seed = Math.floor(Math.random() * 100000);

    const findOptions: any = {
      where: whereClause,
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
          required: true,
          attributes: ["id", "name", "slug", "status"],
          where: { status: true },
        },
      ],

      // 🔥 RANDOM MIX (OLD + NEW products)
      order: this.productsRepository.sequelize!.literal(
        `MOD("Products"."_id" + ${seed}, 100000)`
      ),

      limit: query.limit,
      offset: query.offset,
      distinct: true,
    };

    const { count, rows } =
      await this.productsRepository.findAndCountAll(findOptions);

    return new DataResponseDto(rows, true, "Successfull", query, count);
  } catch (err) {
    if (err instanceof HttpException) throw err;
    throw new InternalServerErrorException(getErrorMessage(err));
  }
}

}
