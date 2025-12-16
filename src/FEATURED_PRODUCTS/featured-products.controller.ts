import {
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  DefaultValuePipe,
  Query,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { ApiTags, ApiParam, ApiQuery } from "@nestjs/swagger";
import { FeaturedProductsService } from "./featured-products.service";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { ApiDataObjectResponse } from "../shared/decorator/dto-dataObject.decorator";
import { GetAllProductsDto } from "./dto/get-all-products.dto";
import { GetPositionProductsDto } from "./dto/get-position-products.dto";

@Controller("featured-products")
@ApiTags("featured-products")
export class FeaturedProductsController {
  constructor(
    private readonly featuredProductsService: FeaturedProductsService
  ) {}

  // PUBLIC ENDPOINT - Get all products with pagination and filters
  @Get("products")
  @HttpCode(200)
  @ApiDataObjectResponse(Object)
  @UsePipes(new ValidationPipe({ transform: true }))
  async getAllProducts(
    @Query() query: GetAllProductsDto
  ): Promise<DataResponseDto> {
    return this.featuredProductsService.getAllProducts(query);
  }

  // PUBLIC ENDPOINT - No authentication required
  // Returns featured products for a specific position (1, 2, 3, or 4)
  @Get("position/:position")
  @HttpCode(200)
  @ApiParam({
    name: "position",
    required: true,
    description:
      "Featured position number (1=top, 2=middle, 3=bottom, 4=extra)",
    example: 1,
  })
  @ApiQuery({
    name: "take",
    required: false,
    description: "Number of featured products to return (max 50)",
    example: 20,
  })
  @ApiDataObjectResponse(Object)
  async getByPosition(
    @Param("position", ParseIntPipe) position: number,
    @Query("take", new DefaultValuePipe(5), ParseIntPipe) take: number
  ): Promise<DataResponseDto> {
    const batchSize = Math.min(Math.max(take, 1), 50);
    return this.featuredProductsService.getProductsByPosition(
      position,
      batchSize
    );
  }

  @Get("position/:position/products")
  @HttpCode(200)
  @ApiParam({
    name: "position",
    required: true,
    description:
      "Featured position number (1=top, 2=middle, 3=bottom, 4=extra)",
    example: 1,
  })
  @ApiDataObjectResponse(Object)
  async getAllProductsForPosition(
    @Param("position", ParseIntPipe) position: number,
    @Query() query: GetPositionProductsDto
  ): Promise<DataResponseDto> {
    return this.featuredProductsService.getAllProductsForPosition(
      position,
      query
    );
  }
}
