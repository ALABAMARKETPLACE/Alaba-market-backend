import {
  BadRequestException,
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { InjectModel } from "@nestjs/sequelize";
import { JwtService } from "@nestjs/jwt";
import * as crypto from "crypto";
import { catchError, firstValueFrom, map } from "rxjs";

import { User } from "../USERS/user.entity";
import { GuestCheckout } from "../PAYSTACK_PAYMENT/guest-checkout.entity";
import { UserCheckout } from "../PAYSTACK_PAYMENT/user-checkout.entity";
import { PaystackService } from "../PAYSTACK_PAYMENT/paystack.service";
import { PaystackInitializeDto } from "../PAYSTACK_PAYMENT/dto/paystack-initialize.dto";
import { PaystackUserInitializeDto } from "../PAYSTACK_PAYMENT/dto/paystack-user-initialize.dto";
import { PaystackGuestInitializeDto } from "../PAYSTACK_PAYMENT/dto/paystack-guest-initialize.dto";
import { OrderPlaceService } from "../ORDER/order.place";
import { GuestOrderService } from "../ORDER/guest-order.service";
import { BudPayVerifyDto } from "./dto/budpay-verify.dto";
import { BudPayWebhookDto } from "./dto/budpay-webhook.dto";
import { Store } from "../STORE/store.entity";
import { BudPayAccountConfigService } from "./budpay-account-config.service";

type BudPayPaymentStatus = "success" | "failed";

@Injectable()
export class BudPayService {
  private readonly logger = new Logger(BudPayService.name);

  constructor(
    private readonly httpService: HttpService,
    @InjectModel(User)
    private readonly userRepository: typeof User,
    @InjectModel(GuestCheckout)
    private readonly guestCheckoutRepository: typeof GuestCheckout,
    @InjectModel(UserCheckout)
    private readonly userCheckoutRepository: typeof UserCheckout,
    @InjectModel(Store)
    private readonly storeRepository: typeof Store,
    private readonly budPayAccountConfigService: BudPayAccountConfigService,
    @Inject(forwardRef(() => OrderPlaceService))
    private readonly orderPlaceService: OrderPlaceService,
    @Inject(forwardRef(() => PaystackService))
    private readonly paystackService: PaystackService,
    @Inject(forwardRef(() => GuestOrderService))
    private readonly guestOrderService: GuestOrderService,
    private readonly jwtService: JwtService,
  ) {}

  private get baseUrl(): string {
    return this.budPayAccountConfigService.getBaseUrl();
  }

  private getHeaders() {
    return this.budPayAccountConfigService.getHeaders();
  }

  getPublicKey(): string | null {
    return process.env.BUDPAY_PUBLIC_KEY || null;
  }

  private generateReference(prefix = "budpay"): string {
    return `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
  }

  private isPublicHttpsUrl(value?: string): boolean {
    if (!value) {
      return false;
    }

    try {
      const url = new URL(value);
      return (
        url.protocol === "https:" &&
        !["localhost", "127.0.0.1", "0.0.0.0"].includes(url.hostname)
      );
    } catch {
      return false;
    }
  }

  private resolveCallbackUrl(rawCallback?: string): string {
    const callback = rawCallback?.trim();
    if (callback) {
      return callback;
    }

    const fallbackBase = [
      process.env.BUDPAY_CALLBACK_URL,
      process.env.FRONTEND_URL,
      "https://dev.alabamarketplace.ng",
    ].find((value) => this.isPublicHttpsUrl(value));

    if (!fallbackBase) {
      return "https://dev.alabamarketplace.ng/payment/callback";
    }

    const baseUrl = new URL(fallbackBase);
    baseUrl.pathname = "/payment/callback";
    baseUrl.search = "";

    return baseUrl.toString();
  }

  private formatKoboAsNaira(amountKobo: number): string {
    return (amountKobo / 100)
      .toFixed(2)
      .replace(/\.00$/, "")
      .replace(/(\.\d)0$/, "$1");
  }

  private async assertBudPaySellerProfiles(storeIds: number[]): Promise<void> {
    if ((process.env.SPLIT_PROVIDER || "paystack").toLowerCase() !== "budpay") {
      return;
    }

    const uniqueStoreIds = [...new Set(storeIds.map(Number))].filter(
      (storeId) => Number.isFinite(storeId) && storeId > 0,
    );
    const stores = await Promise.all(
      uniqueStoreIds.map((storeId) => this.storeRepository.findByPk(storeId)),
    );
    const missingStoreIds = stores.flatMap((store, index) =>
      !store ||
      (!store.budpay_customer_id &&
        !store.budpay_subaccount_id &&
        !store.budpay_virtual_account_id &&
        !store.budpay_account_number)
        ? [store?.id || uniqueStoreIds[index]]
        : [],
    );

    if (
      missingStoreIds.length > 0 &&
      process.env.BUDPAY_ALLOW_COMPANY_FALLBACK !== "true"
    ) {
      throw new BadRequestException(
        `BudPay seller payout profile is missing for store(s): ${missingStoreIds.join(
          ", ",
        )}`,
      );
    }
  }

  private async initializeTransaction(input: {
    email: string;
    amount: number;
    currency?: string;
    reference?: string;
    callback_url?: string;
  }): Promise<any> {
    const amountKobo = Math.round(Number(input.amount));
    if (!Number.isFinite(amountKobo) || amountKobo < 100) {
      throw new BadRequestException("Amount must be at least 100 kobo");
    }

    const reference = input.reference || this.generateReference();
    const callback = this.resolveCallbackUrl(input.callback_url);
    const payload = {
      email: input.email,
      amount: this.formatKoboAsNaira(amountKobo),
      currency: input.currency || "NGN",
      reference,
      callback,
    };

    const response = await firstValueFrom(
      this.httpService
        .post(`${this.baseUrl}/transaction/initialize`, payload, {
          headers: this.getHeaders(),
        })
        .pipe(
          map((result) => result.data),
          catchError((error) => {
            throw new HttpException(
              error?.response?.data?.message ||
                error?.message ||
                "BudPay initialization failed",
              error?.response?.status || HttpStatus.BAD_REQUEST,
            );
          }),
        ),
    );

    if (!response?.status || !response?.data?.authorization_url) {
      throw new BadRequestException(
        response?.message || "BudPay payment initialization failed",
      );
    }

    return {
      authorization_url: response.data.authorization_url,
      access_code: response.data.access_code,
      reference: response.data.reference || reference,
    };
  }

  async initializePayment(initData: PaystackInitializeDto): Promise<any> {
    const data = await this.initializeTransaction(initData);
    return {
      status: true,
      message: "Payment initialized",
      data: {
        ...data,
        amount: Number(initData.amount) / 100,
      },
    };
  }

  async initializeAuthenticatedCheckout(
    userId: number,
    initData: PaystackUserInitializeDto,
  ): Promise<any> {
    const user = await this.userRepository.findByPk(userId);
    if (!user?.email) {
      throw new BadRequestException("Authenticated user not found");
    }

    const preparedCheckout =
      await this.orderPlaceService.prepareAuthenticatedCheckout(
        userId,
        initData.order_payload,
      );
    await this.assertBudPaySellerProfiles(preparedCheckout.store_ids);
    const reference = initData.reference || this.generateReference("budpay_user");
    const data = await this.initializeTransaction({
      email: user.email,
      amount: preparedCheckout.amount_kobo,
      currency: "NGN",
      reference,
      callback_url:
        initData.callback_url || initData.order_payload?.payment?.callback_url,
    });

    await this.paystackService.persistUserCheckoutInitialization(
      reference,
      user,
      initData,
      preparedCheckout,
      "budpay",
    );

    return {
      status: true,
      message: "Payment initialized for checkout",
      data: {
        ...data,
        amount: preparedCheckout.amount,
      },
    };
  }

  async initializeGuestPayment(
    guestData: PaystackGuestInitializeDto,
  ): Promise<any> {
    // The client's amount/delivery_charge/unit_price fields are never trusted for
    // what we actually charge — recompute from the DB and the signed delivery
    // token, same as the Paystack guest checkout path.
    const deliveryToken =
      guestData.order_payload?.delivery?.delivery_token ||
      (guestData.metadata as any)?.delivery?.delivery_token ||
      (guestData.metadata as any)?.delivery_token;
    if (!deliveryToken) {
      throw new BadRequestException(
        "Delivery charge token is required. Please recalculate delivery.",
      );
    }

    let verifiedDelivery: any;
    try {
      verifiedDelivery = await this.jwtService.verifyAsync(deliveryToken);
    } catch {
      throw new BadRequestException(
        "Invalid or expired delivery token. Please recalculate delivery.",
      );
    }

    if (!verifiedDelivery?.data || verifiedDelivery.data.isGuest !== true) {
      throw new BadRequestException("Invalid guest delivery token.");
    }

    const subtotalNaira =
      await this.guestOrderService.calculateGuestCartSubtotalNaira(
        guestData.cart_items,
      );
    const deliveryNaira = Number(verifiedDelivery.data.amount || 0);
    const taxNaira = Number(verifiedDelivery.data.tax || 0);
    const discountNaira = Number(verifiedDelivery.data.discount || 0);
    const amountInKobo = Math.round(
      Math.max(subtotalNaira + deliveryNaira + taxNaira - discountNaira, 0) *
        100,
    );

    const reference = this.generateReference("budpay_guest");
    await this.assertBudPaySellerProfiles(
      guestData.cart_items
        .map((item) => Number(item.store_id))
        .filter((storeId) => Number.isFinite(storeId)),
    );
    const data = await this.initializeTransaction({
      email: guestData.guest_info.email,
      amount: amountInKobo,
      currency: guestData.currency || "NGN",
      reference,
      callback_url:
        guestData.callback_url ||
        `${process.env.FRONTEND_URL || ""}/guest/payment/callback`,
    });

    await this.paystackService.persistGuestCheckoutInitialization(
      reference,
      guestData,
      amountInKobo,
      "budpay",
    );

    return {
      status: true,
      message: "Payment initialized for guest checkout",
      data: {
        ...data,
        amount: amountInKobo / 100,
      },
    };
  }

  private normalizeAmount(data: any, expectedAmountKobo?: number): number {
    const amount = Number(data?.requested_amount ?? data?.amount);
    if (!Number.isFinite(amount)) {
      throw new BadRequestException("BudPay returned an invalid amount");
    }

    const asKobo = Math.round(amount * 100);
    const asLegacyKobo = Math.round(amount);

    if (Number.isFinite(expectedAmountKobo)) {
      if (asKobo === Math.round(expectedAmountKobo)) {
        return asKobo;
      }

      if (asLegacyKobo === Math.round(expectedAmountKobo)) {
        return asLegacyKobo;
      }
    }

    return asKobo;
  }

  private async getExpectedCheckout(reference: string): Promise<{
    amount_kobo: number;
    email: string;
  } | null> {
    const [guestCheckout, userCheckout] = await Promise.all([
      this.guestCheckoutRepository.findOne({ where: { reference } }),
      this.userCheckoutRepository.findOne({ where: { reference } }),
    ]);

    if (guestCheckout) {
      return {
        amount_kobo: Number(guestCheckout.amount_kobo),
        email: guestCheckout.guest_email,
      };
    }

    if (userCheckout) {
      return {
        amount_kobo: Number(userCheckout.amount_kobo),
        email: userCheckout.user_email,
      };
    }

    return null;
  }

  private async fetchVerificationEnvelope(reference: string): Promise<any> {
    return firstValueFrom(
      this.httpService
        .get(
          `${this.baseUrl}/transaction/verify/${encodeURIComponent(
            reference,
          )}`,
          { headers: this.getHeaders() },
        )
        .pipe(
          map((result) => result.data),
          catchError((error) => {
            throw new HttpException(
              error?.response?.data?.message ||
                error?.message ||
                "BudPay verification failed",
              error?.response?.status || HttpStatus.BAD_REQUEST,
            );
          }),
        ),
    );
  }

  private async assertCheckoutMatches(
    reference: string,
    data: any,
  ): Promise<number> {
    const expectedCheckout = await this.getExpectedCheckout(reference);
    const verifiedAmount = this.normalizeAmount(
      data,
      expectedCheckout?.amount_kobo,
    );
    const customerEmail = String(data?.customer?.email || "")
      .trim()
      .toLowerCase();

    if (
      expectedCheckout &&
      verifiedAmount !== Math.round(expectedCheckout.amount_kobo)
    ) {
      throw new BadRequestException("Payment amount mismatch");
    }

    if (
      expectedCheckout?.email &&
      customerEmail !== expectedCheckout.email.trim().toLowerCase()
    ) {
      throw new BadRequestException("Payment email mismatch");
    }

    return verifiedAmount;
  }

  async verifyPayment(verifyData: BudPayVerifyDto): Promise<any> {
    const response = await this.fetchVerificationEnvelope(
      verifyData.reference,
    );

    if (!response?.status || response?.data?.status !== "success") {
      throw new BadRequestException(
        response?.message || "BudPay payment is not successful",
      );
    }

    const verifiedAmount = await this.assertCheckoutMatches(
      verifyData.reference,
      response.data,
    );
    const customerEmail = String(response.data?.customer?.email || "")
      .trim()
      .toLowerCase();

    return {
      ...response,
      data: {
        ...response.data,
        provider_amount: Number(response.data.amount),
        amount: verifiedAmount,
        customer: {
          ...(response.data.customer || {}),
          email: customerEmail,
        },
      },
    };
  }

  async verifyPaymentByReference(reference: string): Promise<any> {
    return this.verifyPayment({ reference });
  }

  private verifyWebhookSignature(
    rawPayload: string,
    signature?: string,
  ): boolean {
    const webhookSecret = process.env.BUDPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return true;
    }
    if (!signature) {
      return false;
    }

    const expected = crypto
      .createHmac("sha512", webhookSecret)
      .update(rawPayload)
      .digest("hex");
    const supplied = String(signature).trim();
    if (expected.length !== supplied.length) {
      return false;
    }

    return crypto.timingSafeEqual(
      Buffer.from(expected, "utf8"),
      Buffer.from(supplied, "utf8"),
    );
  }

  private parseMetadata(metadata: any): Record<string, any> {
    if (metadata && typeof metadata === "object") {
      return metadata;
    }
    if (typeof metadata !== "string" || !metadata.trim()) {
      return {};
    }

    try {
      const parsed = JSON.parse(metadata);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  async processWebhook(
    webhook: BudPayWebhookDto,
    signature: string | undefined,
    rawPayload: string,
  ): Promise<{ status: string; message: string }> {
    if (!this.verifyWebhookSignature(rawPayload, signature)) {
      this.logger.warn(
        {
          event: "webhook_signature_invalid",
          gateway: "budpay",
          paymentReference: webhook.data?.reference,
        },
        "BudPay webhook signature validation failed",
      );
      throw new UnauthorizedException("Invalid webhook signature");
    }

    if (webhook.notify !== "transaction") {
      return { status: "ok", message: "Webhook event ignored" };
    }

    const reference = String(webhook.data?.reference || "").trim();
    if (!reference) {
      throw new BadRequestException("Webhook transaction reference is missing");
    }

    const webhookStatus = String(
      webhook.data?.status || webhook.notifyType || "",
    ).toLowerCase();
    const webhookReportsSuccess =
      webhookStatus === "success" || webhookStatus === "successful";
    const verification = webhookReportsSuccess
      ? await this.verifyPayment({ reference })
      : await this.fetchVerificationEnvelope(reference);
    const verifiedData = verification?.data || {};
    if (!webhookReportsSuccess) {
      await this.assertCheckoutMatches(reference, verifiedData);
    }
    const normalizedStatus = String(
      verifiedData.status || webhookStatus,
    ).toLowerCase();
    const paymentStatus: BudPayPaymentStatus =
      normalizedStatus === "success" || normalizedStatus === "successful"
        ? "success"
        : "failed";
    const normalizedTransaction = {
      ...verifiedData,
      reference,
      amount: verifiedData.amount,
      currency: verifiedData.currency || webhook.data?.currency || "NGN",
      status: paymentStatus,
      customer: {
        ...(webhook.data?.customer || {}),
        ...(verifiedData.customer || {}),
      },
      metadata: {
        ...this.parseMetadata(webhook.data?.metadata),
        ...this.parseMetadata(verifiedData.metadata),
        payment_provider: "budpay",
      },
    };

    try {
      await this.paystackService.finalizePaymentTransaction(
        normalizedTransaction,
        paymentStatus,
        "budpay",
      );
    } catch (error) {
      this.logger.error(
        {
          event: webhook.notifyType,
          gateway: "budpay",
          paymentReference: reference,
          paymentStatus,
          amount: normalizedTransaction.amount,
          err: error,
        },
        "BudPay webhook processing failed",
      );
      throw error;
    }
    this.logger.log(
      {
        event: webhook.notifyType,
        gateway: "budpay",
        paymentReference: reference,
        paymentStatus,
        amount: normalizedTransaction.amount,
      },
      "BudPay webhook processed",
    );

    return { status: "ok", message: "Webhook processed" };
  }
}

