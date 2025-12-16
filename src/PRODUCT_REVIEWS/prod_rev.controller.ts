import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import { ProductReviews } from "./prod_rev.entity";
import { ProductReviewsDto } from "./dto/prod_rev.dto";
import { CreateProductReviewsDto } from "./dto/create.dto";
import { ProductReviewsService } from "./prod_rev.services";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { PageOptionsDtoReview } from "./dto/pageOptionReview.dto";
import { AuthGuard } from "../shared/guards/auth.guard";
import { UserId } from "../shared/decorator/userId_decorator";
import { Public } from "../shared/decorator/optional.decorator";

@Controller("productsReviews")
@ApiTags("productsReviews")
export class ProductReviewsController {
  constructor(private readonly ProductReviewsService: ProductReviewsService) {}

  @Public()
  @UseGuards(AuthGuard)
  @Get("review")
  @ApiBearerAuth()
  @ApiOkResponse({ type: [ProductReviewsDto] })
  findByUserID(
    @UserId() userId: number,
    @Query() pageOpt: PageOptionsDtoReview
  ): Promise<DataResponseDto> {
    return this.ProductReviewsService.findAll(pageOpt,userId);
  }

  @UseGuards(AuthGuard)
  @Post()
  @ApiCreatedResponse({ type: [ProductReviews] })
  @HttpCode(201)
  @ApiBearerAuth()
  create(
    @UserId() UserId: number,
    @Body() createProductsDto: CreateProductReviewsDto
  ): Promise<DataResponseDto> {
    return this.ProductReviewsService.create(UserId, createProductsDto);
  }

  @UseGuards(AuthGuard)
  @Delete(":id")
  @ApiOkResponse({ type: ProductReviews })
  @ApiParam({ name: "id", required: true })
  @ApiBearerAuth()
  delete(
    @UserId() userId: number,
    @Param("id", new ParseIntPipe()) id: number
  ): Promise<DataResponseDto> {
    return this.ProductReviewsService.delete(userId, id);
  }
}
