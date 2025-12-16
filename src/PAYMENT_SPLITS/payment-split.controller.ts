import {
  Body,
  Controller,
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
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { PaymentSplitService } from "./payment-split.service";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { Roles } from "../shared/decorator/roles.decorator";
import { Role } from "../shared/enum/role.enum";
import { AuthGuard } from "../shared/guards/auth.guard";
import { StoreId } from "../shared/decorator/storeId_decorator";

@Controller("payment-splits")
@ApiTags("payment-splits")
export class PaymentSplitController {
  constructor(private readonly paymentSplitService: PaymentSplitService) {}

  // Create payment split (Internal - called when order is created)
  @Post("create/:orderId")
  @ApiCreatedResponse({ type: DataResponseDto })
  @HttpCode(201)
  createPaymentSplit(
    @Param("orderId", ParseIntPipe) orderId: number,
    @Body("totalAmount") totalAmount: number
  ): Promise<any> {
    return this.paymentSplitService.createPaymentSplit(orderId, totalAmount);
  }

  // Process payment with split
  @Post("process/:orderId")
  @ApiCreatedResponse({ type: DataResponseDto })
  @HttpCode(201)
  processPaymentWithSplit(
    @Param("orderId", ParseIntPipe) orderId: number,
    @Body() paymentData: any
  ): Promise<any> {
    return this.paymentSplitService.processPaymentWithSplit(orderId, paymentData);
  }

  // Verify payment
  @Get("verify/:reference")
  @ApiOkResponse({ type: DataResponseDto })
  @HttpCode(200)
  verifyPayment(@Param("reference") reference: string): Promise<DataResponseDto> {
    return this.paymentSplitService.verifyPayment(reference);
  }

  // Get store payment splits (Seller only)
  @Roles(Role.Seller)
  @UseGuards(AuthGuard)
  @Get("store/my-splits")
  @ApiOkResponse({ type: DataResponseDto })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  @HttpCode(200)
  @ApiBearerAuth()
  getMyPaymentSplits(
    @StoreId() storeId: number,
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 20
  ): Promise<DataResponseDto> {
    return this.paymentSplitService.getStorePaymentSplits(storeId, page, limit);
  }

  // Get payment splits for specific store (Admin only)
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Get("store/:storeId")
  @ApiOkResponse({ type: DataResponseDto })
  @ApiParam({ name: "storeId", required: true })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  @ApiBearerAuth()
  getStorePaymentSplits(
    @Param("storeId", ParseIntPipe) storeId: number,
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 20
  ): Promise<DataResponseDto> {
    return this.paymentSplitService.getStorePaymentSplits(storeId, page, limit);
  }

  // Get admin payment splits summary (Admin only)
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Get("admin/summary")
  @ApiOkResponse({ type: DataResponseDto })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  @ApiBearerAuth()
  getAdminPaymentSplits(
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 50
  ): Promise<DataResponseDto> {
    return this.paymentSplitService.getAdminPaymentSplits(page, limit);
  }
}