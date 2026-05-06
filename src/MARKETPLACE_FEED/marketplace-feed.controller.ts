import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Public } from '../shared/decorator/optional.decorator';
import { MarketplaceFeedService } from './marketplace-feed.service';
import { GetMarketplaceProductsDto } from './dto/get-marketplace-products.dto';
import { GetStoreProductsDto } from './dto/get-store-products.dto';
import { SearchMarketplaceDto } from './dto/search-marketplace.dto';
import { GetMarketplaceStoresDto } from './dto/get-marketplace-stores.dto';
import { DataResponseDto } from '../shared/dto/data-response-dto';

@ApiTags('marketplace-feed')
@Controller('marketplace-feed')
export class MarketplaceFeedController {
  constructor(private readonly feedService: MarketplaceFeedService) {}

  // ─── HOME ─────────────────────────────────────────────────────────────────

  @Public()
  @Get('home')
  @ApiOperation({
    summary: 'Marketplace homepage',
    description:
      'Returns all discovery sections in one request: featuredProducts (balanced random), ' +
      'latestProducts, randomStores, and productsByStore (products grouped under store cards). ' +
      'Guest-accessible — no token required.',
  })
  @ApiQuery({ name: 'includeSeo', required: false, type: Boolean, description: 'Append SEO fields to each item' })
  @ApiQuery({ name: 'includeMeta', required: false, type: Boolean, description: 'Include page-level pageMeta in the response data' })
  getHome(
    @Query('includeSeo') includeSeoRaw?: string,
    @Query('includeMeta') includeMetaRaw?: string,
  ): Promise<DataResponseDto> {
    return this.feedService.getHomeData({
      includeSeo: includeSeoRaw === 'true',
      includeMeta: includeMetaRaw === 'true',
    });
  }

  // ─── PRODUCTS ─────────────────────────────────────────────────────────────

  @Public()
  @Get('products')
  @ApiOperation({
    summary: 'Balanced product feed',
    description:
      'Fetches randomized products across all approved stores. ' +
      'The perStoreLimit parameter caps how many products any single store can contribute, ' +
      'preventing one mega-store from dominating the feed (Jumia-style). ' +
      'Guest-accessible — no token required.',
  })
  getProducts(@Query() dto: GetMarketplaceProductsDto): Promise<DataResponseDto> {
    return this.feedService.getBalancedProducts(dto);
  }

  @Public()
  @Get('products/search')
  @ApiOperation({
    summary: 'Global product search',
    description:
      'Searches products by name and description, and store by name across all approved stores. ' +
      'Guest-accessible — no token required.',
  })
  searchProducts(@Query() dto: SearchMarketplaceDto): Promise<DataResponseDto> {
    return this.feedService.searchProducts(dto);
  }

  // ─── STORES ──────────────────────────────────────────────────────────────
  // Literal routes (stores/search) must be declared before the /:storeId param route.

  @Public()
  @Get('stores')
  @ApiOperation({
    summary: 'Discover stores',
    description:
      'Returns approved stores with optional search and sort (random, newest, name_asc, name_desc). ' +
      'Includes productCount. Guest-accessible — no token required.',
  })
  getStores(@Query() dto: GetMarketplaceStoresDto): Promise<DataResponseDto> {
    return this.feedService.getStores(dto);
  }

  @Public()
  @Get('stores/search')
  @ApiOperation({
    summary: 'Search stores',
    description:
      'Searches approved stores by name, store_name, business_name, seller_name, slug, or business_address. ' +
      'Guest-accessible — no token required.',
  })
  searchStores(@Query() dto: GetMarketplaceStoresDto): Promise<DataResponseDto> {
    return this.feedService.searchStores(dto);
  }

  @Public()
  @Get('stores/:storeId')
  @ApiOperation({
    summary: 'Store profile',
    description:
      'Returns the store details, total product count, and up to 8 latest products. ' +
      'Guest-accessible — no token required.',
  })
  @ApiParam({ name: 'storeId', type: Number, description: 'Store primary key (id)' })
  @ApiQuery({ name: 'includeSeo', required: false, type: Boolean, description: 'Add an seo block to the store object' })
  @ApiQuery({ name: 'includeMeta', required: false, type: Boolean, description: 'Add a pageMeta block to the response data' })
  getStoreDetail(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Query('includeSeo') includeSeoRaw?: string,
    @Query('includeMeta') includeMetaRaw?: string,
  ): Promise<DataResponseDto> {
    return this.feedService.getStoreDetail(storeId, {
      includeSeo: includeSeoRaw === 'true',
      includeMeta: includeMetaRaw === 'true',
    });
  }

  @Public()
  @Get('stores/:storeId/products')
  @ApiOperation({
    summary: 'Products from one store',
    description:
      'Paginated, filterable, and sortable product list scoped to a single approved store. ' +
      'Guest-accessible — no token required.',
  })
  @ApiParam({ name: 'storeId', type: Number })
  getStoreProducts(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Query() dto: GetStoreProductsDto,
  ): Promise<DataResponseDto> {
    return this.feedService.getStoreProducts(storeId, dto);
  }

  @Public()
  @Get('stores/:storeId/products/search')
  @ApiOperation({
    summary: 'Search inside one store',
    description:
      'Searches products by name and description within a single approved store. ' +
      'Guest-accessible — no token required.',
  })
  @ApiParam({ name: 'storeId', type: Number })
  searchStoreProducts(
    @Param('storeId', ParseIntPipe) storeId: number,
    @Query() dto: SearchMarketplaceDto,
  ): Promise<DataResponseDto> {
    return this.feedService.searchStoreProducts(storeId, dto);
  }
}
