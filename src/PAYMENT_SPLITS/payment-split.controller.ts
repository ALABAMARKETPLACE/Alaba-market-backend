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
import { UserId } from "../shared/decorator/userId_decorator";
import { RRole } from "../shared/decorator/role_decorator";

@ApiTags("payment-splits")
@Controller("payment-splits")
export class PaymentSplitController {
  constructor(
    private readonly paymentSplitService: PaymentSplitService
  ) {}

  /**
   * Create payment split
   * (Internal – typically after order creation)
   */
  @Post("create/:orderId")
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiCreatedResponse({ type: DataResponseDto })
  @HttpCode(201)
  createPaymentSplit(
    @Param("orderId", ParseIntPipe) orderId: number,
    @UserId() userId: number,
    @StoreId() storeId: number,
    @RRole() role: string,
  ) {
    return this.paymentSplitService.createPaymentSplit(orderId, {
      userId,
      storeId,
      role,
    });
  }

  /**
   * Initialize Paystack payment with split
   */
  @Post("process/:orderId")
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiCreatedResponse({ type: DataResponseDto })
  @HttpCode(201)
  processPaymentWithSplit(
    @Param("orderId", ParseIntPipe) orderId: number,
    @Body() paymentData: any,
    @UserId() userId: number,
    @StoreId() storeId: number,
    @RRole() role: string,
  ) {
    return this.paymentSplitService.processPaymentWithSplit(orderId, paymentData, {
      userId,
      storeId,
      role,
    });
  }

  /**
   * Verify payment
   * (Called manually or by webhook handler)
   */
  @Get("verify/:reference")
  @ApiOkResponse({ type: DataResponseDto })
  @HttpCode(200)
  verifyPayment(
    @Param("reference") reference: string
  ): Promise<DataResponseDto> {
    return this.paymentSplitService.verifyPayment(reference);
  }

  /**
   * Seller – view own payment splits
   */
  @Roles(Role.Seller)
  @UseGuards(AuthGuard)
  @Get("store/my-splits")
  @ApiOkResponse({ type: DataResponseDto })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  @ApiBearerAuth()
  @HttpCode(200)
  getMyPaymentSplits(
    @StoreId() storeId: number,
    @Query("page") page = 1,
    @Query("limit") limit = 20
  ): Promise<DataResponseDto> {
    return this.paymentSplitService.getStorePaymentSplits(
      storeId,
      Number(page),
      Number(limit)
    );
  }

  /**
   * Admin – view payment splits for a store
   */
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Get("store/:storeId")
  @ApiOkResponse({ type: DataResponseDto })
  @ApiParam({ name: "storeId", required: true })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  @ApiBearerAuth()
  @HttpCode(200)
  getStorePaymentSplits(
    @Param("storeId", ParseIntPipe) storeId: number,
    @Query("page") page = 1,
    @Query("limit") limit = 20
  ): Promise<DataResponseDto> {
    return this.paymentSplitService.getStorePaymentSplits(
      storeId,
      Number(page),
      Number(limit)
    );
  }

  /**
   * Admin – payment split summary
   */
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Get("admin/summary")
  @ApiOkResponse({ type: DataResponseDto })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  @ApiBearerAuth()
  @HttpCode(200)
  getAdminPaymentSplits(
    @Query("page") page = 1,
    @Query("limit") limit = 50
  ): Promise<DataResponseDto> {
    return this.paymentSplitService.getAdminPaymentSplits(
      Number(page),
      Number(limit)
    );
  }
}
