import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { QueryTypes } from 'sequelize';
import { Products } from '../PRODUCTS/products.entity';
import { Store } from '../STORE/store.entity';
import { DataResponseDto } from '../shared/dto/data-response-dto';
import { FeedSortOption, GetMarketplaceProductsDto } from './dto/get-marketplace-products.dto';
import { GetStoreProductsDto, StoreFeedSortOption } from './dto/get-store-products.dto';
import { SearchMarketplaceDto, SearchSortOption } from './dto/search-marketplace.dto';
import { GetMarketplaceStoresDto, StoreSortOption } from './dto/get-marketplace-stores.dto';

type FilterInput = {
  category?: number;
  subCategory?: number;
  minPrice?: number;
  maxPrice?: number;
};

type ProductRow = Record<string, any>;
type StoreRow = Record<string, any>;
type SeoOptions = { includeSeo?: boolean };
type SeoAndMetaOptions = SeoOptions & { includeMeta?: boolean };

type PageMetaContext =
  | { type: 'home' }
  | { type: 'products' }
  | { type: 'search'; q: string }
  | { type: 'stores'; q?: string }
  | { type: 'storeDetail'; storeName: string; storeSlug?: string; storeId: number }
  | { type: 'storeProducts'; storeName: string; storeSlug?: string; storeId: number }
  | { type: 'storeSearch'; storeName: string; storeSlug?: string; storeId: number; q: string };

@Injectable()
export class MarketplaceFeedService {
  constructor(
    @Inject('MarketplaceProductsRepository')
    private readonly ProductsRepo: typeof Products,
    @Inject('MarketplaceStoreRepository')
    private readonly StoreRepo: typeof Store,
  ) {}

  private get db() {
    return this.ProductsRepo.sequelize;
  }

  // ─── SQL COLUMN LISTS ────────────────────────────────────────────────────────
  //
  // PRODUCT_COLS matches the `productAttributes` array used across all existing
  // product-search services so the frontend receives the same field set it already
  // knows about.
  //
  // STORE_JOIN_COLS matches the `storeAttributes` array from ProductAttributes
  // (storeDetails is the @BelongsTo alias on the Products entity).

  private readonly PRODUCT_COLS = `
    p."_id",
    p."name",
    p."image",
    p."category",
    p."description",
    p."retail_rate",
    p."price",
    p."status",
    p."subCategory",
    p."title",
    p."unit",
    p."store_id",
    p."pid",
    p."slug",
    p."createdAt",
    p."averageRating",
    p."totalReviews"
  `;

  // Prefixed aliases keep store columns from colliding with product columns.
  private readonly STORE_JOIN_COLS = `
    s."id"                     AS "s_id",
    s."store_name"             AS "s_store_name",
    s."logo_upload"            AS "s_logo_upload",
    s."slug"                   AS "s_slug",
    s."cover_image"            AS "s_cover_image",
    s."averageRating"          AS "s_averageRating",
    s."ratings"                AS "s_ratings",
    s."order_count"            AS "s_order_count",
    s."delivery_period_minutes" AS "s_delivery_period_minutes",
    s."business_types"         AS "s_business_types"
  `;

  // ─── FILTER / SORT HELPERS ───────────────────────────────────────────────────

  private buildProductFilters(
    filters: FilterInput,
    alias = 'p',
  ): { conditions: string[]; replacements: Record<string, any> } {
    const conditions: string[] = [];
    const replacements: Record<string, any> = {};

    if (filters.category !== undefined) {
      conditions.push(`${alias}."category" = :category`);
      replacements.category = filters.category;
    }
    if (filters.subCategory !== undefined) {
      conditions.push(`${alias}."subCategory" = :subCategory`);
      replacements.subCategory = filters.subCategory;
    }
    if (filters.minPrice !== undefined) {
      conditions.push(`${alias}."retail_rate" >= :minPrice`);
      replacements.minPrice = filters.minPrice;
    }
    if (filters.maxPrice !== undefined) {
      conditions.push(`${alias}."retail_rate" <= :maxPrice`);
      replacements.maxPrice = filters.maxPrice;
    }

    return { conditions, replacements };
  }

  private toExtraWhere(conditions: string[]): string {
    return conditions.length ? 'AND ' + conditions.join(' AND ') : '';
  }

  private productSortClause(sort: string, alias: string): string {
    const map: Record<string, string> = {
      random: 'RANDOM()',
      newest: `${alias}."createdAt" DESC`,
      price_low: `${alias}."retail_rate" ASC`,
      price_high: `${alias}."retail_rate" DESC`,
    };
    return map[sort] ?? 'RANDOM()';
  }

  private storeSortClause(sort: StoreSortOption): string {
    const map: Record<StoreSortOption, string> = {
      [StoreSortOption.RANDOM]: 'RANDOM()',
      [StoreSortOption.NEWEST]: 's."createdAt" DESC',
      [StoreSortOption.NAME_ASC]: `COALESCE(NULLIF(s."store_name", ''), s."name", s."business_name") ASC`,
      [StoreSortOption.NAME_DESC]: `COALESCE(NULLIF(s."store_name", ''), s."name", s."business_name") DESC`,
    };
    return map[sort] ?? 'RANDOM()';
  }

  private makePagination(page: number, take: number) {
    return { page: Number(page), take: Number(take) };
  }

  // ─── SEO HELPERS ─────────────────────────────────────────────────────────────

  private buildProductSeo(p: ProductRow): Record<string, string | null> {
    const storeName = p.s_store_name || '';
    const productName = p.name || '';
    const canonicalId = p.slug || p.pid || p._id;
    const desc = p.description
      ? String(p.description).substring(0, 160)
      : `Buy ${productName} at the best price on Alaba Marketplace.`;

    return {
      seoTitle: `${productName}${storeName ? ` — ${storeName}` : ''} | Alaba Marketplace`,
      seoDescription: desc,
      seoKeywords: [productName, storeName, 'buy online', 'Alaba Marketplace']
        .filter(Boolean).join(', '),
      canonicalPath: `/products/${canonicalId}`,
      slug: p.slug ?? null,
      storeSlug: p.s_slug ?? null,
    };
  }

  private buildStoreSeo(s: StoreRow): Record<string, string | null> {
    const displayName = s.store_name || s.name || s.business_name || 'Store';
    const desc = s.description
      ? String(s.description).substring(0, 160)
      : `Shop from ${displayName} on Alaba Marketplace.`;

    return {
      seoTitle: `${displayName} — Online Store | Alaba Marketplace`,
      seoDescription: desc,
      seoKeywords: [displayName, 'online store', 'buy online', 'Alaba Marketplace']
        .filter(Boolean).join(', '),
      canonicalPath: `/stores/${s.slug || s.id}`,
      slug: s.slug ?? null,
    };
  }

  private buildPageMeta(ctx: PageMetaContext): Record<string, string> {
    switch (ctx.type) {
      case 'home':
        return {
          title: 'Alaba Marketplace — Discover Products & Stores',
          description: 'Shop from hundreds of stores on Alaba Marketplace. Discover the best deals.',
          canonicalPath: '/',
          robots: 'index, follow',
          keywords: 'marketplace, online shopping, products, stores, Alaba Marketplace',
        };
      case 'products':
        return {
          title: 'Products | Alaba Marketplace',
          description: 'Discover products from hundreds of stores on Alaba Marketplace.',
          canonicalPath: '/marketplace-feed/products',
          robots: 'index, follow',
          keywords: 'products, buy online, marketplace, Alaba Marketplace',
        };
      case 'search':
        return {
          title: `Search: "${ctx.q}" | Alaba Marketplace`,
          description: `Find products matching "${ctx.q}" on Alaba Marketplace.`,
          canonicalPath: `/marketplace-feed/products/search?q=${encodeURIComponent(ctx.q)}`,
          robots: 'noindex, follow',
          keywords: `${ctx.q}, buy online, Alaba Marketplace`,
        };
      case 'stores':
        return {
          title: ctx.q ? `Stores matching "${ctx.q}" | Alaba Marketplace` : 'Discover Stores | Alaba Marketplace',
          description: ctx.q
            ? `Browse stores matching "${ctx.q}" on Alaba Marketplace.`
            : 'Browse and discover trusted stores on Alaba Marketplace.',
          canonicalPath: ctx.q
            ? `/marketplace-feed/stores?q=${encodeURIComponent(ctx.q)}`
            : '/marketplace-feed/stores',
          robots: 'index, follow',
          keywords: [ctx.q, 'stores', 'sellers', 'Alaba Marketplace'].filter(Boolean).join(', '),
        };
      case 'storeDetail':
        return {
          title: `${ctx.storeName} | Alaba Marketplace`,
          description: `Shop at ${ctx.storeName} on Alaba Marketplace.`,
          canonicalPath: `/stores/${ctx.storeSlug || ctx.storeId}`,
          robots: 'index, follow',
          keywords: `${ctx.storeName}, online store, Alaba Marketplace`,
        };
      case 'storeProducts':
        return {
          title: `Products from ${ctx.storeName} | Alaba Marketplace`,
          description: `Browse products from ${ctx.storeName} on Alaba Marketplace.`,
          canonicalPath: `/stores/${ctx.storeSlug || ctx.storeId}/products`,
          robots: 'index, follow',
          keywords: `${ctx.storeName}, products, Alaba Marketplace`,
        };
      case 'storeSearch':
        return {
          title: `Search in ${ctx.storeName}: "${ctx.q}" | Alaba Marketplace`,
          description: `Find "${ctx.q}" in ${ctx.storeName} on Alaba Marketplace.`,
          canonicalPath: `/stores/${ctx.storeSlug || ctx.storeId}/products/search?q=${encodeURIComponent(ctx.q)}`,
          robots: 'noindex, follow',
          keywords: `${ctx.q}, ${ctx.storeName}, Alaba Marketplace`,
        };
    }
  }

  // When includeMeta=true, wrap the items array in an object that also carries pageMeta.
  // DataResponseDto pagination is driven by the separately-passed `total` COUNT, not the
  // data shape, so wrapping here does not affect meta.take / meta.totalPages.
  private wrapItems<T>(
    items: T[],
    pageMeta: Record<string, string> | null,
    includeMeta: boolean,
  ): T[] | { items: T[]; pageMeta: Record<string, string> } {
    return includeMeta && pageMeta ? { items, pageMeta } : items;
  }

  // ─── 1. BALANCED PRODUCT FEED ────────────────────────────────────────────────

  async getBalancedProducts(dto: GetMarketplaceProductsDto): Promise<DataResponseDto> {
    const page = Number(dto.page ?? 1);
    const take = Number(dto.take ?? 20);
    const perStoreLimit = Number(dto.perStoreLimit ?? 3);
    const sort = dto.sort ?? FeedSortOption.RANDOM;
    const offset = (page - 1) * take;

    const { conditions, replacements: filterRepl } = this.buildProductFilters(dto);
    const extraWhere = this.toExtraWhere(conditions);
    const innerSort = this.productSortClause(sort, 'p');
    const outerSort = this.productSortClause(sort, 'ranked');
    const baseRepl = { ...filterRepl, perStoreLimit, take, offset };

    const sql = `
      SELECT
        ranked."_id", ranked."name", ranked."image", ranked."category",
        ranked."description", ranked."retail_rate", ranked."price", ranked."status",
        ranked."subCategory", ranked."title", ranked."unit", ranked."store_id",
        ranked."pid", ranked."slug", ranked."createdAt", ranked."averageRating", ranked."totalReviews",
        ranked."s_id", ranked."s_store_name", ranked."s_logo_upload", ranked."s_slug",
        ranked."s_cover_image", ranked."s_averageRating", ranked."s_ratings",
        ranked."s_order_count", ranked."s_delivery_period_minutes", ranked."s_business_types"
      FROM (
        SELECT
          ${this.PRODUCT_COLS},
          ${this.STORE_JOIN_COLS},
          ROW_NUMBER() OVER (
            PARTITION BY p."store_id"
            ORDER BY ${innerSort}
          ) AS "store_rank"
        FROM "PRODUCTS" p
        INNER JOIN "STORE" s ON s."id" = p."store_id"
        WHERE p."status" = true
          AND p."unit" > 0
          AND p."store_id" IS NOT NULL
          AND s."status" = 'approved'
          ${extraWhere}
      ) ranked
      WHERE ranked."store_rank" <= :perStoreLimit
      ORDER BY ${outerSort}
      LIMIT :take OFFSET :offset
    `;

    const countSql = `
      SELECT COUNT(*) AS "count"
      FROM "PRODUCTS" p
      INNER JOIN "STORE" s ON s."id" = p."store_id"
      WHERE p."status" = true AND p."unit" > 0
        AND p."store_id" IS NOT NULL AND s."status" = 'approved'
        ${extraWhere}
    `;

    const [rows, countRows] = await Promise.all([
      this.db.query(sql, { replacements: baseRepl, type: QueryTypes.SELECT }),
      this.db.query(countSql, { replacements: filterRepl, type: QueryTypes.SELECT }),
    ]);

    const total = Number((countRows[0] as any)?.count ?? 0);
    const items = this.formatProducts(rows as ProductRow[], { includeSeo: dto.includeSeo });
    const pageMeta = dto.includeMeta ? this.buildPageMeta({ type: 'products' }) : null;

    return new DataResponseDto(
      this.wrapItems(items, pageMeta, !!dto.includeMeta),
      true,
      'Products fetched successfully',
      this.makePagination(page, take) as any,
      total,
    );
  }

  // ─── 2. GLOBAL PRODUCT SEARCH ────────────────────────────────────────────────

  async searchProducts(dto: SearchMarketplaceDto): Promise<DataResponseDto> {
    const page = Number(dto.page ?? 1);
    const take = Number(dto.take ?? 20);
    const sort = dto.sort ?? SearchSortOption.NEWEST;
    const offset = (page - 1) * take;
    const search = `%${dto.q}%`;

    const { conditions, replacements: filterRepl } = this.buildProductFilters(dto);
    const extraWhere = this.toExtraWhere(conditions);
    const orderBy = this.productSortClause(sort, 'p');
    const baseRepl = { ...filterRepl, search, take, offset };

    const sql = `
      SELECT
        ${this.PRODUCT_COLS},
        ${this.STORE_JOIN_COLS}
      FROM "PRODUCTS" p
      INNER JOIN "STORE" s ON s."id" = p."store_id"
      WHERE p."status" = true
        AND p."unit" > 0
        AND p."store_id" IS NOT NULL
        AND s."status" = 'approved'
        AND (
          p."name"             ILIKE :search
          OR p."description"   ILIKE :search
          OR s."store_name"    ILIKE :search
          OR s."name"          ILIKE :search
          OR s."business_name" ILIKE :search
        )
        ${extraWhere}
      ORDER BY ${orderBy}
      LIMIT :take OFFSET :offset
    `;

    const countSql = `
      SELECT COUNT(*) AS "count"
      FROM "PRODUCTS" p
      INNER JOIN "STORE" s ON s."id" = p."store_id"
      WHERE p."status" = true AND p."unit" > 0
        AND p."store_id" IS NOT NULL AND s."status" = 'approved'
        AND (
          p."name" ILIKE :search OR p."description" ILIKE :search
          OR s."store_name" ILIKE :search OR s."name" ILIKE :search
          OR s."business_name" ILIKE :search
        )
        ${extraWhere}
    `;

    const [rows, countRows] = await Promise.all([
      this.db.query(sql, { replacements: baseRepl, type: QueryTypes.SELECT }),
      this.db.query(countSql, { replacements: { ...filterRepl, search }, type: QueryTypes.SELECT }),
    ]);

    const total = Number((countRows[0] as any)?.count ?? 0);
    const items = this.formatProducts(rows as ProductRow[], { includeSeo: dto.includeSeo });
    const pageMeta = dto.includeMeta ? this.buildPageMeta({ type: 'search', q: dto.q }) : null;

    return new DataResponseDto(
      this.wrapItems(items, pageMeta, !!dto.includeMeta),
      true,
      'Search results fetched',
      this.makePagination(page, take) as any,
      total,
    );
  }

  // ─── 3. STORE DISCOVERY ──────────────────────────────────────────────────────

  async getStores(dto: GetMarketplaceStoresDto): Promise<DataResponseDto> {
    const page = Number(dto.page ?? 1);
    const take = Number(dto.take ?? 20);
    const sort = dto.sort ?? StoreSortOption.RANDOM;
    const offset = (page - 1) * take;

    const searchCondition = dto.q
      ? `AND (
          s."store_name"       ILIKE :search
          OR s."name"          ILIKE :search
          OR s."business_name" ILIKE :search
          OR s."seller_name"   ILIKE :search
          OR s."slug"          ILIKE :search
          OR s."business_address" ILIKE :search
        )`
      : '';

    const orderBy = this.storeSortClause(sort);
    const baseRepl: Record<string, any> = { take, offset };
    if (dto.q) baseRepl.search = `%${dto.q}%`;

    // Store listing shape mirrors the storeAttributes used in ProductAttributes +
    // the fields returned by StoreSearchServices.getStoreDetails().
    const sql = `
      SELECT
        s."id",
        s."store_name",
        s."name",
        s."business_name",
        s."seller_name",
        s."logo_upload",
        s."cover_image",
        s."slug",
        s."business_address",
        s."description",
        s."averageRating",
        s."ratings",
        s."order_count",
        s."delivery_period_minutes",
        s."createdAt",
        COUNT(p."_id") AS "productCount"
      FROM "STORE" s
      LEFT JOIN "PRODUCTS" p
        ON p."store_id" = s."id" AND p."status" = true AND p."unit" > 0
      WHERE s."status" = 'approved'
        ${searchCondition}
      GROUP BY s."id"
      ORDER BY ${orderBy}
      LIMIT :take OFFSET :offset
    `;

    const countSql = `
      SELECT COUNT(*) AS "count"
      FROM "STORE" s
      WHERE s."status" = 'approved' ${searchCondition}
    `;

    const countRepl: Record<string, any> = {};
    if (dto.q) countRepl.search = `%${dto.q}%`;

    const [rows, countRows] = await Promise.all([
      this.db.query(sql, { replacements: baseRepl, type: QueryTypes.SELECT }),
      this.db.query(countSql, { replacements: countRepl, type: QueryTypes.SELECT }),
    ]);

    const total = Number((countRows[0] as any)?.count ?? 0);
    const items = this.formatStores(rows as StoreRow[], { includeSeo: dto.includeSeo });
    const pageMeta = dto.includeMeta
      ? this.buildPageMeta({ type: 'stores', q: dto.q })
      : null;

    return new DataResponseDto(
      this.wrapItems(items, pageMeta, !!dto.includeMeta),
      true,
      'Stores fetched successfully',
      this.makePagination(page, take) as any,
      total,
    );
  }

  // ─── 4. STORE SEARCH ─────────────────────────────────────────────────────────

  async searchStores(dto: GetMarketplaceStoresDto): Promise<DataResponseDto> {
    return this.getStores(dto);
  }

  // ─── 5. SINGLE STORE DETAIL ──────────────────────────────────────────────────

  async getStoreDetail(storeId: number, opts: SeoAndMetaOptions = {}): Promise<DataResponseDto> {
    // Store attributes mirror StoreSearchServices.getStoreDetails()
    const [storeRows, countRows, latestRows] = await Promise.all([
      this.db.query(
        `SELECT
           "id", "store_name", "name", "business_name", "seller_name",
           "logo_upload", "cover_image", "slug", "business_address",
           "description", "averageRating", "ratings",
           "order_count", "delivery_period_minutes",
           "from", "to", "createdAt"
         FROM "STORE"
         WHERE "id" = :storeId AND "status" = 'approved'
         LIMIT 1`,
        { replacements: { storeId }, type: QueryTypes.SELECT },
      ),
      this.db.query(
        `SELECT COUNT(*) AS "count"
         FROM "PRODUCTS"
         WHERE "store_id" = :storeId AND "status" = true AND "unit" > 0`,
        { replacements: { storeId }, type: QueryTypes.SELECT },
      ),
      // Latest products use the same productAttributes shape
      this.db.query(
        `SELECT
           "_id", "name", "image", "category", "description",
           "retail_rate", "price", "status", "subCategory", "title",
           "unit", "store_id", "pid", "slug", "createdAt",
           "averageRating", "totalReviews"
         FROM "PRODUCTS"
         WHERE "store_id" = :storeId AND "status" = true AND "unit" > 0
         ORDER BY "createdAt" DESC
         LIMIT 8`,
        { replacements: { storeId }, type: QueryTypes.SELECT },
      ),
    ]);

    if (!storeRows.length) throw new NotFoundException('Store not found or not active');

    const store = storeRows[0] as any;
    const productCount = Number((countRows[0] as any)?.count ?? 0);
    const storeName = store.store_name || store.name || store.business_name || 'Store';

    const responseData: Record<string, any> = {
      ...store,
      productCount,
      latestProducts: latestRows,
    };

    if (opts.includeSeo) {
      responseData.seo = this.buildStoreSeo(store);
    }
    if (opts.includeMeta) {
      responseData.pageMeta = this.buildPageMeta({
        type: 'storeDetail',
        storeName,
        storeSlug: store.slug,
        storeId,
      });
    }

    return new DataResponseDto(responseData, true, 'Store details fetched');
  }

  // ─── 6. PRODUCTS FROM ONE STORE ──────────────────────────────────────────────

  async getStoreProducts(storeId: number, dto: GetStoreProductsDto): Promise<DataResponseDto> {
    const page = Number(dto.page ?? 1);
    const take = Number(dto.take ?? 20);
    const sort = dto.sort ?? StoreFeedSortOption.NEWEST;
    const offset = (page - 1) * take;

    const { conditions, replacements: filterRepl } = this.buildProductFilters(dto);
    const extraWhere = this.toExtraWhere(conditions);
    const orderBy = this.productSortClause(sort, 'p');
    const baseRepl = { ...filterRepl, storeId: Number(storeId), take, offset };

    const sql = `
      SELECT
        ${this.PRODUCT_COLS},
        ${this.STORE_JOIN_COLS}
      FROM "PRODUCTS" p
      INNER JOIN "STORE" s ON s."id" = p."store_id" AND s."status" = 'approved'
      WHERE p."store_id" = :storeId
        AND p."status" = true
        AND p."unit" > 0
        ${extraWhere}
      ORDER BY ${orderBy}
      LIMIT :take OFFSET :offset
    `;

    const countSql = `
      SELECT COUNT(*) AS "count"
      FROM "PRODUCTS" p
      INNER JOIN "STORE" s ON s."id" = p."store_id" AND s."status" = 'approved'
      WHERE p."store_id" = :storeId AND p."status" = true AND p."unit" > 0
        ${extraWhere}
    `;

    const [rows, countRows, storeRows] = await Promise.all([
      this.db.query(sql, { replacements: baseRepl, type: QueryTypes.SELECT }),
      this.db.query(countSql, { replacements: { ...filterRepl, storeId: Number(storeId) }, type: QueryTypes.SELECT }),
      dto.includeMeta
        ? this.db.query(
            `SELECT "store_name", "name", "slug" FROM "STORE" WHERE "id" = :storeId LIMIT 1`,
            { replacements: { storeId }, type: QueryTypes.SELECT },
          )
        : Promise.resolve([]),
    ]);

    const total = Number((countRows[0] as any)?.count ?? 0);
    const items = this.formatProducts(rows as ProductRow[], { includeSeo: dto.includeSeo });
    const storeInfo = storeRows[0] as any;
    const storeName = storeInfo ? storeInfo.store_name || storeInfo.name || '' : '';
    const pageMeta = dto.includeMeta
      ? this.buildPageMeta({ type: 'storeProducts', storeName, storeSlug: storeInfo?.slug, storeId })
      : null;

    return new DataResponseDto(
      this.wrapItems(items, pageMeta, !!dto.includeMeta),
      true,
      'Store products fetched',
      this.makePagination(page, take) as any,
      total,
    );
  }

  // ─── 7. SEARCH WITHIN ONE STORE ──────────────────────────────────────────────

  async searchStoreProducts(storeId: number, dto: SearchMarketplaceDto): Promise<DataResponseDto> {
    const page = Number(dto.page ?? 1);
    const take = Number(dto.take ?? 20);
    const sort = dto.sort ?? SearchSortOption.NEWEST;
    const offset = (page - 1) * take;
    const search = `%${dto.q}%`;

    const { conditions, replacements: filterRepl } = this.buildProductFilters(dto);
    const extraWhere = this.toExtraWhere(conditions);
    const orderBy = this.productSortClause(sort, 'p');
    const baseRepl = { ...filterRepl, storeId: Number(storeId), search, take, offset };

    const sql = `
      SELECT
        ${this.PRODUCT_COLS},
        ${this.STORE_JOIN_COLS}
      FROM "PRODUCTS" p
      INNER JOIN "STORE" s ON s."id" = p."store_id" AND s."status" = 'approved'
      WHERE p."store_id" = :storeId
        AND p."status" = true
        AND p."unit" > 0
        AND (p."name" ILIKE :search OR p."description" ILIKE :search)
        ${extraWhere}
      ORDER BY ${orderBy}
      LIMIT :take OFFSET :offset
    `;

    const countSql = `
      SELECT COUNT(*) AS "count"
      FROM "PRODUCTS" p
      INNER JOIN "STORE" s ON s."id" = p."store_id" AND s."status" = 'approved'
      WHERE p."store_id" = :storeId AND p."status" = true AND p."unit" > 0
        AND (p."name" ILIKE :search OR p."description" ILIKE :search)
        ${extraWhere}
    `;

    const [rows, countRows, storeRows] = await Promise.all([
      this.db.query(sql, { replacements: baseRepl, type: QueryTypes.SELECT }),
      this.db.query(countSql, { replacements: { ...filterRepl, storeId: Number(storeId), search }, type: QueryTypes.SELECT }),
      dto.includeMeta
        ? this.db.query(
            `SELECT "store_name", "name", "slug" FROM "STORE" WHERE "id" = :storeId LIMIT 1`,
            { replacements: { storeId }, type: QueryTypes.SELECT },
          )
        : Promise.resolve([]),
    ]);

    const total = Number((countRows[0] as any)?.count ?? 0);
    const items = this.formatProducts(rows as ProductRow[], { includeSeo: dto.includeSeo });
    const storeInfo = storeRows[0] as any;
    const storeName = storeInfo ? storeInfo.store_name || storeInfo.name || '' : '';
    const pageMeta = dto.includeMeta
      ? this.buildPageMeta({ type: 'storeSearch', storeName, storeSlug: storeInfo?.slug, storeId, q: dto.q })
      : null;

    return new DataResponseDto(
      this.wrapItems(items, pageMeta, !!dto.includeMeta),
      true,
      'Search results fetched',
      this.makePagination(page, take) as any,
      total,
    );
  }

  // ─── 8. HOMEPAGE DISCOVERY ───────────────────────────────────────────────────

  async getHomeData(opts: SeoAndMetaOptions = {}): Promise<DataResponseDto> {
    const [featuredRows, latestRows, storeRows, sampledStoreRows] = await Promise.all([
      // Balanced random products — 2 per store, up to 16 total
      this.db.query(
        `SELECT
           ranked."_id", ranked."name", ranked."image", ranked."category",
           ranked."description", ranked."retail_rate", ranked."price", ranked."status",
           ranked."subCategory", ranked."title", ranked."unit", ranked."store_id",
           ranked."pid", ranked."slug", ranked."createdAt", ranked."averageRating", ranked."totalReviews",
           ranked."s_id", ranked."s_store_name", ranked."s_logo_upload", ranked."s_slug",
           ranked."s_cover_image", ranked."s_averageRating", ranked."s_ratings",
           ranked."s_order_count", ranked."s_delivery_period_minutes", ranked."s_business_types"
         FROM (
           SELECT
             ${this.PRODUCT_COLS},
             ${this.STORE_JOIN_COLS},
             ROW_NUMBER() OVER (PARTITION BY p."store_id" ORDER BY RANDOM()) AS "store_rank"
           FROM "PRODUCTS" p
           INNER JOIN "STORE" s ON s."id" = p."store_id"
           WHERE p."status" = true AND p."unit" > 0
             AND p."store_id" IS NOT NULL AND s."status" = 'approved'
         ) ranked
         WHERE ranked."store_rank" <= 2
         ORDER BY RANDOM()
         LIMIT 16`,
        { type: QueryTypes.SELECT },
      ),

      // Latest 16 products across all approved stores
      this.db.query(
        `SELECT
           ${this.PRODUCT_COLS},
           ${this.STORE_JOIN_COLS}
         FROM "PRODUCTS" p
         INNER JOIN "STORE" s ON s."id" = p."store_id" AND s."status" = 'approved'
         WHERE p."status" = true AND p."unit" > 0 AND p."store_id" IS NOT NULL
         ORDER BY p."createdAt" DESC
         LIMIT 16`,
        { type: QueryTypes.SELECT },
      ),

      // 8 random approved stores (store listing shape)
      this.db.query(
        `SELECT
           s."id", s."store_name", s."name", s."business_name", s."seller_name",
           s."logo_upload", s."cover_image", s."slug", s."business_address",
           s."description", s."averageRating", s."ratings",
           s."order_count", s."delivery_period_minutes", s."createdAt",
           COUNT(p."_id") AS "productCount"
         FROM "STORE" s
         LEFT JOIN "PRODUCTS" p ON p."store_id" = s."id" AND p."status" = true AND p."unit" > 0
         WHERE s."status" = 'approved'
         GROUP BY s."id"
         ORDER BY RANDOM()
         LIMIT 8`,
        { type: QueryTypes.SELECT },
      ),

      // 4 random stores with products for the "Shop by store" section
      this.db.query(
        `SELECT s."id" AS "s_id", s."store_name", s."name", s."logo_upload", s."slug"
         FROM "STORE" s
         WHERE s."status" = 'approved'
           AND EXISTS (
             SELECT 1 FROM "PRODUCTS" p
             WHERE p."store_id" = s."id" AND p."status" = true AND p."unit" > 0
           )
         ORDER BY RANDOM()
         LIMIT 4`,
        { type: QueryTypes.SELECT },
      ),
    ]);

    // Fetch 6 random products per sampled store (productAttributes shape, no store join needed)
    const productsByStore = await Promise.all(
      (sampledStoreRows as StoreRow[]).map(async (store) => {
        const products = await this.db.query(
          `SELECT
             "_id", "name", "image", "category", "description",
             "retail_rate", "price", "status", "subCategory", "title",
             "unit", "store_id", "pid", "slug", "createdAt",
             "averageRating", "totalReviews"
           FROM "PRODUCTS"
           WHERE "store_id" = :storeId AND "status" = true AND "unit" > 0
           ORDER BY RANDOM()
           LIMIT 6`,
          { replacements: { storeId: store.s_id }, type: QueryTypes.SELECT },
        );
        return {
          store: {
            id: store.s_id,
            store_name: store.store_name,
            name: store.name,
            logo_upload: store.logo_upload,
            slug: store.slug,
          },
          products,
        };
      }),
    );

    const responseData: Record<string, any> = {
      featuredProducts: this.formatProducts(featuredRows as ProductRow[], { includeSeo: opts.includeSeo }),
      latestProducts: this.formatProducts(latestRows as ProductRow[], { includeSeo: opts.includeSeo }),
      randomStores: this.formatStores(storeRows as StoreRow[], { includeSeo: opts.includeSeo }),
      productsByStore,
    };

    if (opts.includeMeta) {
      responseData.pageMeta = this.buildPageMeta({ type: 'home' });
    }

    return new DataResponseDto(responseData, true, 'Marketplace home data fetched');
  }

  // ─── FORMATTERS ──────────────────────────────────────────────────────────────
  //
  // Product shape mirrors `productAttributes` from the existing ProductAttributes class.
  // The `storeDetails` key matches the @BelongsTo alias on the Products entity.
  // The nested store shape mirrors `storeAttributes` from ProductAttributes.

  private formatProducts(rows: ProductRow[], opts: SeoOptions = {}) {
    return rows.map((p) => {
      const item: Record<string, any> = {
        _id: p._id,
        name: p.name,
        image: p.image,
        category: p.category,
        description: p.description,
        retail_rate: p.retail_rate,
        price: p.price,
        status: p.status,
        subCategory: p.subCategory,
        title: p.title,
        unit: p.unit,
        store_id: p.store_id,
        pid: p.pid ?? null,
        slug: p.slug ?? null,
        createdAt: p.createdAt,
        averageRating: p.averageRating,
        totalReviews: p.totalReviews,
        // Nested store mirrors what Sequelize returns for the storeDetails BelongsTo include
        storeDetails: p.s_id
          ? {
              id: p.s_id,
              store_name: p.s_store_name ?? null,
              logo_upload: p.s_logo_upload ?? null,
              slug: p.s_slug ?? null,
              cover_image: p.s_cover_image ?? null,
              averageRating: p.s_averageRating,
              ratings: p.s_ratings,
              order_count: p.s_order_count,
              delivery_period_minutes: p.s_delivery_period_minutes,
              business_types: p.s_business_types ?? null,
            }
          : null,
      };

      if (opts.includeSeo) {
        item.seo = this.buildProductSeo(p);
      }

      return item;
    });
  }

  // Store listing shape mirrors what StoreSearchServices returns in getStoreDetails()
  // and the `storeAttributes` array from ProductAttributes.
  private formatStores(rows: StoreRow[], opts: SeoOptions = {}) {
    return rows.map((s) => {
      const item: Record<string, any> = {
        id: s.id,
        store_name: s.store_name,
        name: s.name,
        business_name: s.business_name,
        seller_name: s.seller_name,
        logo_upload: s.logo_upload,
        cover_image: s.cover_image,
        slug: s.slug ?? null,
        business_address: s.business_address,
        description: s.description,
        averageRating: s.averageRating,
        ratings: s.ratings,
        order_count: s.order_count,
        delivery_period_minutes: s.delivery_period_minutes,
        createdAt: s.createdAt,
        productCount: Number(s.productCount ?? 0),
      };

      if (opts.includeSeo) {
        item.seo = this.buildStoreSeo(s);
      }

      return item;
    });
  }
}
