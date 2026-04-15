import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  Param,
  Query,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiTags,
  ApiParam,
} from "@nestjs/swagger";
import { ProductsDto } from "../PRODUCTS/dto/products.dto";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { ApiPaginatedResponse } from "../shared/decorator/dto-paginated.decorator";
import { ProductSearchMultiDto } from "./dto/productSearchMultiDto";
import { ProductSearchServiceMulti } from "./product_search_multi";
import { ProductSearchServiceSingle } from "./product_search_single";
import { ProductSearchSingleDto } from "./dto/productSearchSingle.dto";
import { ApiDataObjectResponse } from "../shared/decorator/dto-dataObject.decorator";
import { ProductServiceMain } from "./product_service_main";
import { ProductSearchStoreDto } from "./dto/product_search_store.dto";
import { ProductSearchStoreService } from "./product_search_store";
import { ApiDataArrayResponse } from "../shared/decorator/dto-dataArray.decorator";
import {
  ProductSearchByCategory,
  ProductSearchItemByCategory,
} from "./dto/product_search_getall.dto";
import { TopStoreDto } from "./dto/top_store_response.dto";
import { TopSellingStoresDto } from "./dto/top_stores.dto";
import { TopStoreService } from "./product_search_topstore";
import { RecommendationDto } from "./dto/recommendation.dto";
import { Public } from "../shared/decorator/optional.decorator";
import { AuthGuard } from "../shared/guards/auth.guard";
import { UserId } from "../shared/decorator/userId_decorator";
import { BoostedCategoryDto } from "./dto/boosted-category.dto";
@Controller("product_search")
@ApiTags("product_search")
export class ProductSearchController {
  constructor(
    private readonly productSearchMulti: ProductSearchServiceMulti,
    private readonly productSearchSingle: ProductSearchServiceSingle,
    private readonly productServiceMain: ProductServiceMain,
    private readonly productSearchStore: ProductSearchStoreService,
    private readonly topStoreService: TopStoreService,
  ) {}
  //search for products for both multi and single. params:keyword, type

  @UsePipes(new ValidationPipe({ transform: true }))
  @Get("multi")
  @ApiBearerAuth()
  @ApiPaginatedResponse(ProductsDto)
  @UsePipes(new ValidationPipe({ transform: true }))
  searchMulti(
    @Query() pageOpt: ProductSearchMultiDto,
  ): Promise<DataResponseDto> {
    return this.productSearchMulti.fetchProductsMulti(pageOpt);
  }

  @UsePipes(new ValidationPipe({ transform: true }))
  @Get("single")
  @ApiBearerAuth()
  @ApiPaginatedResponse(ProductsDto)
  @UsePipes(new ValidationPipe({ transform: true }))
  searchSingle(
    @Query() pageOpt: ProductSearchSingleDto,
  ): Promise<DataResponseDto> {
    return this.productSearchSingle.fetchProductsSingle(pageOpt);
  }

  // to get top selling store
  @Get("store_top")
  @ApiOkResponse({ type: [TopStoreDto] })
  @HttpCode(200)
  @UsePipes(new ValidationPipe({ transform: true }))
  getTopStores(
    @Query() options: TopSellingStoresDto,
  ): Promise<DataResponseDto> {
    return this.topStoreService.getTopStores(options);
  }
  @Get("print/available")
  @ApiOkResponse({ type: [TopStoreDto] })
  @HttpCode(200)
  @UsePipes(new ValidationPipe({ transform: true }))
  getPrintStore(
    @Query() options: TopSellingStoresDto,
  ): Promise<DataResponseDto> {
    return this.topStoreService.getPrintStore(options);
  }

  @Public()
  @UseGuards(AuthGuard)
  @Get("details/slug/:slug")
  @ApiBearerAuth()
  @ApiParam({ name: "slug", required: true })
  @ApiDataObjectResponse(ProductsDto)
  @UsePipes(new ValidationPipe({ transform: true }))
  findOneBySlug(
    @Param("slug") slug: string,
    @UserId() userId: number,
  ): Promise<DataResponseDto> {
    return this.productServiceMain.fetchOneProductBySlug(slug, userId);
  }

  @Public()
  @UseGuards(AuthGuard)
  @Get("details/:id")
  @ApiBearerAuth()
  @ApiParam({ name: "id", required: true })
  @ApiDataObjectResponse(ProductsDto)
  @UsePipes(new ValidationPipe({ transform: true }))
  findOne(
    @Param("id") id: string,
    @UserId() userId: number,
  ): Promise<DataResponseDto> {
    return this.productServiceMain.fetchOneProduct(id, userId);
  }

  @UsePipes(new ValidationPipe({ transform: true }))
  @Get("autocomplete")
  @ApiBearerAuth()
  @ApiDataArrayResponse(ProductsDto)
  @UsePipes(new ValidationPipe({ transform: true }))
  autoComplete(@Query() query: RecommendationDto): Promise<DataResponseDto> {
    return this.productServiceMain.getRecommendations(query);
  }

  @UsePipes(new ValidationPipe({ transform: true }))
  @Get("store/:slug")
  @ApiBearerAuth()
  @ApiOkResponse({ type: [ProductsDto] })
  @UsePipes(new ValidationPipe({ transform: true }))
  storeSearch(
    @Param("slug") name: string,
    @Query() pageOpt: ProductSearchStoreDto,
  ): Promise<DataResponseDto> {
    return this.productSearchStore.fetchProductsOnStore(name, pageOpt);
  }

  //to get all products in a store grouped by subcategory
  @UsePipes(new ValidationPipe({ transform: true }))
  @Get("store_items/:slug")
  @ApiBearerAuth()
  @ApiOkResponse({ type: [ProductsDto] })
  @UsePipes(new ValidationPipe({ transform: true }))
  storeItems(
    @Param("slug") name: string,
    @Query() pageOpt: ProductSearchByCategory,
  ): Promise<DataResponseDto> {
    return this.productSearchStore.fetchByCategory(pageOpt, name);
  }

  @UsePipes(new ValidationPipe({ transform: true }))
  @Get("store_items/category/products")
  @ApiBearerAuth()
  @ApiOkResponse({ type: [ProductsDto] })
  @UsePipes(new ValidationPipe({ transform: true }))
  storeItemsCategory(
    @Query() pageOpt: ProductSearchItemByCategory,
  ): Promise<DataResponseDto> {
    return this.productSearchStore.fetchProductByCategory(pageOpt);
  }

  @UsePipes(new ValidationPipe({ transform: true }))
  @Get("boosted-category")
  @ApiBearerAuth()
  @ApiPaginatedResponse(ProductsDto)
  @UsePipes(new ValidationPipe({ transform: true }))
  async boostedCategory(
    @Query() query: BoostedCategoryDto,
  ): Promise<DataResponseDto> {
    return this.productServiceMain.fetchBoostedCategory(query);
  }

  //=======================================================================================old
}
