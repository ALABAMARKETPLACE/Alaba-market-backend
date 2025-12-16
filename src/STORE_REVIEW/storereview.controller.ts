import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { StoreReviewService } from "./storereview.service";
import { StoreReviewDto } from "./dto/storereview.dto";
import { CreateStoreReviewDto } from "./dto/createStoreReview.dto";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { ApiDataArrayResponse } from "../shared/decorator/dto-dataArray.decorator";
import { ApiDataObjectResponse } from "../shared/decorator/dto-dataObject.decorator";
import { UserId } from "../shared/decorator/userId_decorator";
import { AuthGuard } from "../shared/guards/auth.guard";

@Controller("storereview")
@ApiTags("storereview")
export class StoreReviewController {
  constructor(private readonly storereviewService: StoreReviewService) {}

  @UseGuards(AuthGuard)
  @Post("create")
  @ApiDataObjectResponse(StoreReviewDto)
  @HttpCode(201)
  @ApiBearerAuth()
  create(
    @UserId() userId: number,
    @Body() create: CreateStoreReviewDto
  ): Promise<DataResponseDto> {
    return this.storereviewService.create(userId, create);
  }
}
