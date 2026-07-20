import {
  BadRequestException,
  Body,
  Controller,
  forwardRef,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Inject,
  Logger,
  Query,
  RawBodyRequest,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { Request } from "express";
import { AuthGuard } from "../shared/guards/auth.guard";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { PaystackService } from "./paystack.service";
import {
  PaystackInitializeDto,
  PaystackInitializeResponseDto,
} from "./dto/paystack-initialize.dto";
import {
  PaystackVerificationResponseDto,
  PaystackVerifyDto,
} from "./dto/paystack-verify.dto";
import {
  PaystackRefundDto,
  PaystackRefundResponseDto,
} from "./dto/paystack-refund.dto";
import { PaystackWebhookDto } from "./dto/paystack-webhook.dto";
import { PaystackGuestInitializeDto } from "./dto/paystack-guest-initialize.dto";
import { PaystackUserInitializeDto } from "./dto/paystack-user-initialize.dto";
import { Public } from "../shared/decorator/optional.decorator";
import { PaystackWebhookResponseDto } from "./dto/paystack-webhook.dto";
import { UserId } from "../shared/decorator/userId_decorator";
import { Roles } from "../shared/decorator/roles.decorator";
import { Role } from "../shared/enum/role.enum";
import { ReconcilePaystackTransactionsDto } from "./dto/reconcile-paystack-transactions.dto";
import { DiagnosePaystackTransactionDto } from "./dto/diagnose-paystack-transaction.dto";
import { ManualSettlementAuditDto } from "./dto/manual-settlement-audit.dto";
import { SkipThrottle, Throttle } from "@nestjs/throttler";
import { BudPayService } from "../BUDPAY_PAYMENT/budpay.service";
import { PalmPayService } from "../PALMPAY_PAYMENT/palmpay.service";

@Controller("paystack")
@ApiTags("Paystack Payment")
export class PaystackController {
  private readonly logger = new Logger(PaystackController.name);

  constructor(
    private readonly paystackService: PaystackService,
    @Inject(forwardRef(() => BudPayService))
    private readonly budPayService: BudPayService,
    @Inject(forwardRef(() => PalmPayService))
    private readonly palmPayService: PalmPayService,
  ) {}

  private resolveProvider(data: {
    payment_provider?: string;
    payment_channel?: string;
  }): "paystack" | "budpay" | "palmpay" {
    const provider = (
      data.payment_provider ||
      data.payment_channel ||
      process.env.PAYMENT_PROVIDER ||
      "paystack"
    ).toLowerCase();
    return provider === "budpay" || provider === "palmpay"
      ? provider
      : "paystack";
  }

  private useBudPay(data: {
    payment_provider?: string;
    payment_channel?: string;
  }): boolean {
    return this.resolveProvider(data) === "budpay";
  }

  private usePalmPay(data: {
    payment_provider?: string;
    payment_channel?: string;
  }): boolean {
    return this.resolveProvider(data) === "palmpay";
  }

  private normalizeUserInitializeData(
    data: PaystackUserInitializeDto & Record<string, any>,
  ): PaystackUserInitializeDto {
    if (data?.order_payload || !data?.cart) {
      return data;
    }

    return {
      ...data,
      callback_url: data.callback_url || data.payment?.callback_url,
      order_payload: {
        cart: data.cart,
        payment: data.payment,
        address: data.address,
        charges: data.charges,
      },
    };
  }

  @Post("initialize")
  @Throttle({ default: { ttl: 60000, limit: 20 } })
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Initialize Paystack payment transaction",
    description:
      "Returns a Paystack authorization URL and reference. callback_url should point to an existing browser redirect route such as /paystack/success.",
  })
  @ApiOkResponse({
    description: "Payment initialized successfully",
    type: PaystackInitializeResponseDto,
  })
  async initializePayment(
    @Body() initData: PaystackInitializeDto,
  ): Promise<PaystackInitializeResponseDto> {
    if (this.useBudPay(initData)) {
      return await this.budPayService.initializePayment(initData);
    }
    if (this.usePalmPay(initData)) {
      return await this.palmPayService.initializePayment(initData);
    }
    return await this.paystackService.initializePayment(initData);
  }

  @Post("initialize-checkout")
  @Throttle({ default: { ttl: 60000, limit: 20 } })
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      "Initialize a single Paystack checkout for a logged-in cart. The webhook finalizes one order per store.",
    description:
      "Backend-driven checkout initializer. The backend validates the order payload, creates one Paystack transaction for the full cart, and the Paystack webhook creates the final per-store orders after successful payment.",
  })
  @ApiOkResponse({
    description: "Checkout payment initialized successfully",
    type: PaystackInitializeResponseDto,
  })
  async initializeAuthenticatedCheckout(
    @UserId() userId: number,
    @Body() initData: PaystackUserInitializeDto,
  ): Promise<PaystackInitializeResponseDto> {
    initData = this.normalizeUserInitializeData(initData);
    this.logger.log(
      {
        event: "checkout_initialization_requested",
        gateway: this.resolveProvider(initData),
        userId,
        storeIds: initData.order_payload?.cart?.map((item) => item.storeId),
      },
      "authenticated checkout initialization requested",
    );
    if (this.useBudPay(initData)) {
      return await this.budPayService.initializeAuthenticatedCheckout(
        userId,
        initData,
      );
    }
    if (this.usePalmPay(initData)) {
      return await this.palmPayService.initializeAuthenticatedCheckout(
        userId,
        initData,
      );
    }
    return await this.paystackService.initializeAuthenticatedCheckout(
      userId,
      initData,
    );
  }

  // GUEST USER INITIALIZATION STARTS HERE

  @Post("initialize-guest")
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Public() // ✅ No authentication required
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Initialize Paystack payment for guest checkout",
    description:
      "Returns a Paystack authorization URL for guest checkout. If order_payload is provided, the webhook can create guest orders without frontend verification.",
  })
  @ApiOkResponse({
    description: "Guest payment initialized successfully",
  })
  async initializeGuestPayment(
    @Body() guestData: PaystackGuestInitializeDto,
  ): Promise<any> {
    this.logger.log(
      {
        event: "guest_checkout_initialization_requested",
        gateway: this.resolveProvider(guestData),
        storeIds: guestData.cart_items?.map((item) => item.store_id),
        amount: guestData.amount + guestData.delivery_charge,
      },
      "guest checkout initialization requested",
    );
    if (this.useBudPay(guestData)) {
      return await this.budPayService.initializeGuestPayment(guestData);
    }
    if (this.usePalmPay(guestData)) {
      return await this.palmPayService.initializeGuestPayment(guestData);
    }
    return await this.paystackService.initializeGuestPayment(guestData);
  }

  @Get("manual-settlement/audit")
  @Get("settlement-audit")
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      "Audit company-account collections, legacy non-split payments, and manual seller-payout exposure",
  })
  @ApiOkResponse({
    description: "Manual settlement audit records retrieved successfully",
    type: DataResponseDto,
  })
  async getManualSettlementAudit(
    @Query() query: ManualSettlementAuditDto,
  ): Promise<DataResponseDto> {
    return await this.paystackService.getManualSettlementAudit(query);
  }

  @Post("verify-guest")
  @Public() // ✅ No authentication required
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Verify guest payment transaction" })
  @ApiOkResponse({
    description: "Guest payment verification completed",
  })
  async verifyGuestPayment(
    @Body() verifyData: { reference: string; guest_email: string },
  ): Promise<any> {
    // Verify payment
    const verification = await this.paystackService.verifyPayment({
      reference: verifyData.reference,
    });

    // Additional check: ensure email matches
    if (
      verification.data?.customer?.email?.toLowerCase() !==
      verifyData.guest_email?.toLowerCase()
    ) {
      throw new BadRequestException("Payment email mismatch");
    }

    return verification;
  }

  // GUEST USER INITIALIZATION ENDS HERE

  @Post("initialize-split")
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      "Initialize Paystack payment with automatic split settlement",
  })
  @ApiOkResponse({
    description: "Split payment initialized successfully",
    type: PaystackInitializeResponseDto,
  })
  async initializeSplitPayment(
    @Body() initData: PaystackInitializeDto,
  ): Promise<PaystackInitializeResponseDto> {
    // Force split payment to true
    initData.split_payment = true;
    return await this.paystackService.initializePayment(initData);
  }

  @Post("verify")
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Verify Paystack payment transaction" })
  @ApiOkResponse({
    description: "Payment verification completed",
    type: PaystackVerificationResponseDto,
  })
  async verifyPayment(
    @Body() verifyData: PaystackVerifyDto,
  ): Promise<PaystackVerificationResponseDto> {
    return await this.paystackService.verifyPayment(verifyData);
  }

  @Get("verify")
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Verify payment by reference (GET method)" })
  @ApiQuery({
    name: "reference",
    description: "Payment reference to verify",
    required: true,
  })
  @ApiOkResponse({
    description: "Payment verification completed",
  })
  async verifyPaymentByReference(
    @Query("reference") reference: string,
  ): Promise<any> {
    return await this.paystackService.verifyPaymentByReference(reference);
  }

  @Post("refund")
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Process Paystack refund" })
  @ApiOkResponse({
    description: "Refund processed successfully",
    type: PaystackRefundResponseDto,
  })
  async createRefund(
    @Body() refundData: PaystackRefundDto,
  ): Promise<PaystackRefundResponseDto> {
    return await this.paystackService.createRefund(refundData);
  }

  @Post("webhook")
  @SkipThrottle()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Handle Paystack webhook events" })
  @ApiOkResponse({
    description: "Webhook processed successfully",
    type: PaystackWebhookResponseDto,
  })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers("x-paystack-signature") signature: string,
    @Body() webhookData: PaystackWebhookDto,
  ): Promise<PaystackWebhookResponseDto> {
    // Get raw body for signature verification
    const rawBody = req.rawBody?.toString("utf8") || JSON.stringify(webhookData);
    this.logger.log(
      {
        event: webhookData.event,
        gateway: "paystack",
        paymentReference: webhookData.data?.reference,
        paymentStatus: webhookData.data?.status,
        amount: webhookData.data?.amount,
      },
      "Paystack webhook received",
    );

    return await this.paystackService.processWebhook(
      webhookData,
      signature,
      rawBody,
    );
  }

  @Get("public-key")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get Paystack public key for frontend integration" })
  @ApiOkResponse({
    description: "Public key retrieved successfully",
  })
  getPublicKey(): { publicKey: string } {
    return {
      publicKey: this.paystackService.getPublicKey(),
    };
  }

  @Get("transaction")
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get transaction details by reference" })
  @ApiQuery({
    name: "reference",
    description: "Transaction reference",
    required: true,
  })
  @ApiOkResponse({
    description: "Transaction details retrieved successfully",
  })
  async getTransactionDetails(
    @Query("reference") reference: string,
  ): Promise<any> {
    return await this.paystackService.getTransactionDetails(reference);
  }

  @Get("transactions")
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "List transactions with pagination" })
  @ApiQuery({
    name: "page",
    description: "Page number",
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: "perPage",
    description: "Items per page",
    required: false,
    type: Number,
  })
  @ApiOkResponse({
    description: "Transactions retrieved successfully",
  })
  async listTransactions(
    @Query("page") page: number = 1,
    @Query("perPage") perPage: number = 50,
  ): Promise<any> {
    return await this.paystackService.listTransactions(page, perPage);
  }

  @Post("transactions/reconcile")
  @UseGuards(AuthGuard)
  @Roles(Role.Admin)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Reconcile historical Paystack transactions into the app database",
    description:
      "Scans Paystack transactions, checks whether each reference already exists locally, and can replay successful or failed transactions through the existing webhook sync logic.",
  })
  @ApiOkResponse({
    description: "Paystack reconciliation completed successfully",
  })
  async reconcileTransactions(
    @Body() data: ReconcilePaystackTransactionsDto,
  ): Promise<DataResponseDto> {
    return await this.paystackService.reconcileTransactions(data);
  }

  @Post("transactions/diagnose")
  @UseGuards(AuthGuard)
  @Roles(Role.Admin)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Diagnose why a Paystack transaction can or cannot be reconciled",
    description:
      "Fetches one Paystack transaction by reference and reports which local records were found, which recovery paths are available, and why reconciliation would succeed or be skipped.",
  })
  @ApiOkResponse({
    description: "Paystack transaction diagnosis generated successfully",
  })
  async diagnoseTransaction(
    @Body() data: DiagnosePaystackTransactionDto,
  ): Promise<DataResponseDto> {
    return await this.paystackService.diagnoseTransaction(data.reference);
  }

  @Get("success")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Payment success callback endpoint",
    description:
      "Simple browser redirect target after Paystack payment. This is not the webhook endpoint.",
  })
  @ApiOkResponse({
    description: "Payment success page",
  })
  paymentSuccess(@Query() query: any): any {
    return {
      status: "success",
      message: "Payment completed successfully",
      reference: query.reference,
      trxref: query.trxref,
    };
  }

  @Get("cancel")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Payment cancellation callback endpoint",
    description:
      "Simple browser redirect target when a Paystack payment is cancelled. This is not the webhook endpoint.",
  })
  @ApiOkResponse({
    description: "Payment cancellation page",
  })
  paymentCancel(@Query() query: any): any {
    return {
      status: "cancelled",
      message: "Payment was cancelled",
      reference: query.reference,
    };
  }

  @Get("failed")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Payment failure callback endpoint",
    description:
      "Simple browser redirect target when a Paystack payment fails. This is not the webhook endpoint.",
  })
  @ApiOkResponse({
    description: "Payment failure page",
  })
  paymentFailed(@Query() query: any): any {
    return {
      status: "failed",
      message: "Payment failed",
      reference: query.reference,
    };
  }
}
