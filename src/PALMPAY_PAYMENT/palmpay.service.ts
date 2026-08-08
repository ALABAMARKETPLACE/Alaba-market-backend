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
import { PalmPayConfigService } from "./palmpay-config.service";
import { PalmPaySignatureService } from "./palmpay-signature.service";

type PalmPayCheckout = {
  amount_kobo: number;
  email: string;
  type: "guest" | "user";
};

@Injectable()
export class PalmPayService {
  private readonly logger = new Logger(PalmPayService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly config: PalmPayConfigService,
    private readonly signatureService: PalmPaySignatureService,
    @InjectModel(User)
    private readonly userRepository: typeof User,
    @InjectModel(GuestCheckout)
    private readonly guestCheckoutRepository: typeof GuestCheckout,
    @InjectModel(UserCheckout)
    private readonly userCheckoutRepository: typeof UserCheckout,
    @Inject(forwardRef(() => OrderPlaceService))
    private readonly orderPlaceService: OrderPlaceService,
    @Inject(forwardRef(() => PaystackService))
    private readonly paystackService: PaystackService,
    @Inject(forwardRef(() => GuestOrderService))
    private readonly guestOrderService: GuestOrderService,
    private readonly jwtService: JwtService
  ) {}

  async initializePayment(initData: PaystackInitializeDto): Promise<any> {
    const reference = this.resolveReference(initData.reference, "PPS");
    const data = await this.createPalmPayOrder({
      reference,
      amountKobo: Number(initData.amount),
      currency: initData.currency || "NGN",
      callbackUrl: initData.callback_url,
      customerInfo: {
        email: initData.email.toLowerCase().trim().slice(0, 50),
      },
      goodsDetails: [{ goodsId: reference }],
    });

    return this.initializationResponse(data, Number(initData.amount));
  }

  async initializeAuthenticatedCheckout(
    userId: number,
    initData: PaystackUserInitializeDto
  ): Promise<any> {
    const user = await this.userRepository.findByPk(userId);
    if (!user?.email) {
      throw new BadRequestException("Authenticated user not found");
    }

    const preparedCheckout =
      await this.orderPlaceService.prepareAuthenticatedCheckout(
        userId,
        initData.order_payload
      );
    const reference = this.resolveReference(initData.reference, "PPU");
    const data = await this.createPalmPayOrder({
      reference,
      amountKobo: preparedCheckout.amount_kobo,
      currency: "NGN",
      callbackUrl:
        initData.callback_url || initData.order_payload?.payment?.callback_url,
      customerInfo: {
        userId: String(user._id),
        email: user.email.toLowerCase().trim().slice(0, 50),
      },
      goodsDetails: this.buildAuthenticatedGoodsDetails(initData),
    });

    await this.paystackService.persistUserCheckoutInitialization(
      reference,
      user,
      initData,
      preparedCheckout,
      "palmpay"
    );

    return this.initializationResponse(data, preparedCheckout.amount_kobo);
  }

  async initializeGuestPayment(
    guestData: PaystackGuestInitializeDto
  ): Promise<any> {
    const amountInKobo = await this.calculateGuestAmount(guestData);
    const reference = this.resolveReference(undefined, "PPG");
    const guest = guestData.guest_info;
    const data = await this.createPalmPayOrder({
      reference,
      amountKobo: amountInKobo,
      currency: guestData.currency || "NGN",
      callbackUrl: guestData.callback_url,
      customerInfo: {
        userId: reference.slice(0, 15),
        userName: `${guest.first_name} ${guest.last_name}`.trim().slice(0, 15),
        phone: guest.phone.trim().slice(0, 15),
        email: guest.email.toLowerCase().trim().slice(0, 50),
      },
      goodsDetails: guestData.cart_items.map((item) => ({
        goodsId: String(item.product_id),
        quantity: Number(item.quantity),
      })),
    });

    await this.paystackService.persistGuestCheckoutInitialization(
      reference,
      guestData,
      amountInKobo,
      "palmpay"
    );

    return this.initializationResponse(data, amountInKobo);
  }

  async verifyPayment(reference: string): Promise<any> {
    this.assertReference(reference);
    const response = await this.postToPalmPay(
      "/api/v2/payment/merchant/order/queryStatus",
      { orderId: reference }
    );
    const data = response?.data || {};
    if (data.orderId && data.orderId !== reference) {
      throw new BadRequestException("PalmPay payment reference mismatch");
    }

    const expected = await this.getExpectedCheckout(reference);
    this.assertTransactionMatches(reference, data, expected);
    const status = this.mapOrderStatus(data.orderStatus);

    return {
      status: true,
      message: response.respMsg || "PalmPay transaction queried",
      data: {
        ...data,
        reference,
        provider_reference: data.orderNo,
        status,
        amount: Number(data.amount),
        currency: data.currency || "NGN",
        customer: expected ? { email: expected.email } : undefined,
      },
    };
  }

  async verifyGuestPayment(
    reference: string,
    guestEmail: string
  ): Promise<any> {
    const checkout = await this.guestCheckoutRepository.findOne({
      where: { reference },
    });
    if (
      !checkout ||
      checkout.guest_email.toLowerCase().trim() !==
        guestEmail.toLowerCase().trim()
    ) {
      throw new BadRequestException("Guest checkout details do not match");
    }

    return this.verifyPayment(reference);
  }

  async processWebhook(webhook: Record<string, any>): Promise<void> {
    if (!this.signatureService.verifyCallback(webhook)) {
      this.logger.warn(
        {
          event: "webhook_signature_invalid",
          gateway: "palmpay",
          paymentReference: webhook?.orderId,
        },
        "PalmPay webhook signature validation failed"
      );
      throw new UnauthorizedException("Invalid PalmPay webhook signature");
    }

    if (webhook.appId && webhook.appId !== this.config.getAppId()) {
      throw new UnauthorizedException("PalmPay webhook App ID mismatch");
    }

    const reference = String(webhook.orderId || "").trim();
    this.assertReference(reference);
    const verification = await this.verifyPayment(reference);
    const paymentStatus = verification.data.status;

    if (paymentStatus === "pending") {
      this.logger.log(
        { gateway: "palmpay", paymentReference: reference },
        "PalmPay webhook acknowledged while transaction is pending"
      );
      return;
    }

    await this.paystackService.finalizePaymentTransaction(
      {
        ...verification.data,
        metadata: { payment_provider: "palmpay" },
      },
      paymentStatus,
      "palmpay"
    );

    this.logger.log(
      {
        event: "payment_notification",
        gateway: "palmpay",
        paymentReference: reference,
        paymentStatus,
        amount: verification.data.amount,
      },
      "PalmPay webhook processed"
    );
  }

  private async createPalmPayOrder(input: {
    reference: string;
    amountKobo: number;
    currency: string;
    callbackUrl?: string;
    customerInfo: Record<string, any>;
    goodsDetails: Record<string, any>[];
  }): Promise<any> {
    const amount = Math.round(Number(input.amountKobo));
    if (!Number.isFinite(amount) || amount < 100) {
      throw new BadRequestException("Amount must be at least 100 kobo");
    }

    const response = await this.postToPalmPay(
      "/api/v2/payment/merchant/createorder",
      {
        orderId: input.reference,
        title: "Alaba Marketplace order",
        description: "Marketplace checkout",
        amount,
        currency: input.currency.toUpperCase(),
        notifyUrl: this.config.getNotifyUrl(),
        callBackUrl: this.config.getCallbackUrl(input.callbackUrl),
        goodsDetails: JSON.stringify(input.goodsDetails),
        customerInfo: JSON.stringify(input.customerInfo),
      }
    );

    if (!response?.data?.checkoutUrl) {
      throw new BadRequestException(
        response?.respMsg || "PalmPay checkout URL was not returned"
      );
    }

    return {
      authorization_url: response.data.checkoutUrl,
      checkout_url: response.data.checkoutUrl,
      access_code: response.data.payToken,
      reference: input.reference,
      provider_reference: response.data.orderNo,
      order_status: response.data.orderStatus,
    };
  }

  private async postToPalmPay(
    path: string,
    businessPayload: Record<string, any>
  ): Promise<any> {
    const payload = {
      requestTime: Date.now(),
      version: "V1.1",
      nonceStr: crypto.randomBytes(16).toString("hex"),
      ...businessPayload,
    };
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.config.getAppId()}`,
      CountryCode: this.config.getCountryCode(),
      Signature: this.signatureService.sign(payload),
    };

    return firstValueFrom(
      this.httpService
        .post(`${this.config.getBaseUrl()}${path}`, payload, { headers })
        .pipe(
          map((result) => {
            const response = result.data;
            if (response?.respCode !== "00000000") {
              throw new BadRequestException(
                response?.respMsg || "PalmPay request failed"
              );
            }
            return response;
          }),
          catchError((error) => {
            if (error instanceof HttpException) {
              throw error;
            }
            throw new HttpException(
              error?.response?.data?.respMsg ||
                error?.response?.data?.message ||
                error?.message ||
                "PalmPay request failed",
              error?.response?.status || HttpStatus.BAD_REQUEST
            );
          })
        )
    );
  }

  private async calculateGuestAmount(
    guestData: PaystackGuestInitializeDto
  ): Promise<number> {
    const deliveryToken = guestData.order_payload?.delivery?.delivery_token;
    if (!deliveryToken) {
      throw new BadRequestException(
        "Delivery charge token is required. Please recalculate delivery."
      );
    }

    let verifiedDelivery: any;
    try {
      verifiedDelivery = await this.jwtService.verifyAsync(deliveryToken);
    } catch {
      throw new BadRequestException(
        "Invalid or expired delivery token. Please recalculate delivery."
      );
    }
    if (!verifiedDelivery?.data || verifiedDelivery.data.isGuest !== true) {
      throw new BadRequestException("Invalid guest delivery token.");
    }

    const subtotal =
      await this.guestOrderService.calculateGuestCartSubtotalNaira(
        guestData.cart_items
      );
    const delivery = Number(verifiedDelivery.data.amount || 0);
    const tax = Number(verifiedDelivery.data.tax || 0);
    const discount = Number(verifiedDelivery.data.discount || 0);
    return Math.round(Math.max(subtotal + delivery + tax - discount, 0) * 100);
  }

  private async getExpectedCheckout(
    reference: string
  ): Promise<PalmPayCheckout | null> {
    const [guestCheckout, userCheckout] = await Promise.all([
      this.guestCheckoutRepository.findOne({ where: { reference } }),
      this.userCheckoutRepository.findOne({ where: { reference } }),
    ]);
    if (guestCheckout) {
      return {
        amount_kobo: Number(guestCheckout.amount_kobo),
        email: guestCheckout.guest_email,
        type: "guest",
      };
    }
    if (userCheckout) {
      return {
        amount_kobo: Number(userCheckout.amount_kobo),
        email: userCheckout.user_email,
        type: "user",
      };
    }
    return null;
  }

  private assertTransactionMatches(
    reference: string,
    data: any,
    expected: PalmPayCheckout | null
  ): void {
    if (data.orderId && data.orderId !== reference) {
      throw new BadRequestException("PalmPay payment reference mismatch");
    }
    if (expected && Number(data.amount) !== Math.round(expected.amount_kobo)) {
      throw new BadRequestException("PalmPay payment amount mismatch");
    }
    if (data.currency && String(data.currency).toUpperCase() !== "NGN") {
      throw new BadRequestException("PalmPay payment currency mismatch");
    }
  }

  private mapOrderStatus(status: any): "success" | "failed" | "pending" {
    const value = Number(status);
    if (value === 2) return "success";
    if (value === 3 || value === 4) return "failed";
    if (value === 0 || value === 1) return "pending";
    throw new BadRequestException("PalmPay returned an unknown order status");
  }

  private buildAuthenticatedGoodsDetails(
    initData: PaystackUserInitializeDto
  ): Record<string, any>[] {
    return (initData.order_payload?.cart || []).flatMap((store: any) =>
      (store.products || []).map((item: any) => ({
        goodsId: String(item.productId),
        quantity: Number(item.quantity),
      }))
    );
  }

  private initializationResponse(data: any, amountKobo: number): any {
    return {
      status: true,
      message: "Payment initialized",
      data: { ...data, amount: amountKobo / 100 },
    };
  }

  private resolveReference(
    reference: string | undefined,
    prefix: string
  ): string {
    const value =
      reference?.trim() ||
      `${prefix}${Date.now().toString(36)}${crypto
        .randomBytes(4)
        .toString("hex")}`;
    this.assertReference(value);
    return value;
  }

  private assertReference(reference: string): void {
    if (!/^[A-Za-z0-9]{1,32}$/.test(reference)) {
      throw new BadRequestException(
        "PalmPay reference must contain only letters and numbers and be at most 32 characters"
      );
    }
  }
}
