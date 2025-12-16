import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { ApiBearerAuth, ApiParam, ApiTags } from "@nestjs/swagger";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { ApiDataArrayResponse } from "../shared/decorator/dto-dataArray.decorator";
import { SubCategory } from "../SUB_CATEGORY/sub_category.entity";
import { StoreSearchServices } from "./store_search.service";
import { Banner } from "../BANNER/banner.entity";

import { AuthGuard } from "../shared/guards/auth.guard";
import { Roles } from "../shared/decorator/roles.decorator";
import { Role } from "../shared/enum/role.enum";
import { StoreId } from "../shared/decorator/storeId_decorator";
import { StoreLocationCategoryDto, StoreLocationDto } from "./dto/store_latlong.dto";
import { Public } from "../shared/decorator/optional.decorator";
@Controller("store_search")
@ApiTags("store_search")
export class SearchStoreController {
  constructor(private readonly storeSearchService: StoreSearchServices) {}

  //to get all store info only for sellers
  @Roles(Role.Seller)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  @Get("info")
  @ApiBearerAuth()
  @ApiDataArrayResponse(SubCategory)
  getstoreDetails(@StoreId() storeId: number): Promise<DataResponseDto> {
    return this.storeSearchService.getStoreInfo(storeId);
  }

  //to get the store info and available subcategories for a single store
  @UsePipes(new ValidationPipe({ transform: true }))
  @Get("info/:slug")
  @ApiBearerAuth()
  @ApiDataArrayResponse(SubCategory)
  getSubcategoriesByStore(
    @Param("slug") slug: string,
    @Query() query: StoreLocationDto
  ): Promise<DataResponseDto> {
    return this.storeSearchService.getStoreDetails(slug, query);
  }

  @UsePipes(new ValidationPipe({ transform: true }))
  @Get("info/category/store")
  @ApiBearerAuth()
  @ApiDataArrayResponse(SubCategory)
  @Public()
  getCategoryByStore(
    @Query() query: StoreLocationCategoryDto
  ): Promise<DataResponseDto> {
    return this.storeSearchService.getCategoryByStore(query);
  }

  // to get banners of a single store
  @UsePipes(new ValidationPipe({ transform: true }))
  @Get("banner/:id")
  @ApiBearerAuth()
  @ApiDataArrayResponse(Banner)
  getBannerByStore(@Param("id") id: number): Promise<DataResponseDto> {
    return this.storeSearchService.getBannerByStore(id);
  }
}
