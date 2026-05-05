import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Role } from "../shared/enum/role.enum";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { Roles } from "../shared/decorator/roles.decorator";
import { StoreId } from "../shared/decorator/storeId_decorator";
import { UserId } from "../shared/decorator/userId_decorator";
import { AuthGuard } from "../shared/guards/auth.guard";
import { InitializeBoosterDto } from "./dto/initialize-booster.dto";
import { UpdateBoostedProductsDto } from "./dto/update-boosted-products.dto";
import { VerifyBoosterDto } from "./dto/verify-booster.dto";
import { SellerBoosterService } from "./seller-booster.service";

@Controller("seller/booster")
@ApiTags("seller-booster")
export class SellerBoosterController {
  constructor(private readonly boosterService: SellerBoosterService) {}

  @Get("plans")
  @HttpCode(200)
  @ApiOperation({ summary: "Get seller booster plans" })
  getPlans(): Promise<DataResponseDto> {
    return this.boosterService.getPlans();
  }

  @Post("initialize")
  @Roles(Role.Seller)
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({ summary: "Initialize seller booster payment" })
  initialize(
    @UserId() sellerId: number,
    @StoreId() storeId: number,
    @Body() dto: InitializeBoosterDto,
  ): Promise<DataResponseDto> {
    return this.boosterService.initializePayment(sellerId, storeId, dto);
  }

  @Post("verify")
  @Roles(Role.Seller)
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({ summary: "Verify and activate seller booster payment" })
  verify(
    @UserId() sellerId: number,
    @StoreId() storeId: number,
    @Body() dto: VerifyBoosterDto,
  ): Promise<DataResponseDto> {
    return this.boosterService.verifyAndActivate(
      sellerId,
      storeId,
      dto.reference,
    );
  }

  @Get("status")
  @Roles(Role.Seller)
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({ summary: "Get current seller booster status" })
  getStatus(
    @UserId() sellerId: number,
    @StoreId() storeId: number,
  ): Promise<DataResponseDto> {
    return this.boosterService.getStatus(sellerId, storeId);
  }

  @Put("products")
  @Roles(Role.Seller)
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({ summary: "Update selected boosted products" })
  updateProducts(
    @UserId() sellerId: number,
    @StoreId() storeId: number,
    @Body() dto: UpdateBoostedProductsDto,
  ): Promise<DataResponseDto> {
    return this.boosterService.updateSelectedProducts(sellerId, storeId, dto);
  }

  @Post("cancel")
  @Roles(Role.Seller)
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({ summary: "Cancel current seller booster" })
  cancel(
    @UserId() sellerId: number,
    @StoreId() storeId: number,
  ): Promise<DataResponseDto> {
    return this.boosterService.cancel(sellerId, storeId);
  }
}
