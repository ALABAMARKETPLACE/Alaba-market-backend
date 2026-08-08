import { afterEach, describe, expect, it, jest } from "@jest/globals";
import * as crypto from "crypto";
import { of } from "rxjs";

import { PalmPayConfigService } from "./palmpay-config.service";
import { PalmPaySignatureService } from "./palmpay-signature.service";
import { PalmPayService } from "./palmpay.service";

describe("PalmPayService", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    [
      "PALMPAY_APP_ID",
      "PALMPAY_MERCHANT_PRIVATE_KEY",
      "PALMPAY_PLATFORM_PUBLIC_KEY",
      "PALMPAY_NOTIFY_URL",
      "PALMPAY_CALLBACK_URL",
      "PALMPAY_BASE_URL",
    ].forEach((name) => delete process.env[name]);
  });

  const createService = () => {
    const pair = crypto.generateKeyPairSync("rsa", {
      modulusLength: 2048,
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
      publicKeyEncoding: { type: "spki", format: "pem" },
    });
    process.env.PALMPAY_APP_ID = "L123456";
    process.env.PALMPAY_MERCHANT_PRIVATE_KEY = pair.privateKey;
    process.env.PALMPAY_PLATFORM_PUBLIC_KEY = pair.publicKey;
    process.env.PALMPAY_NOTIFY_URL = "https://api.example.com/palmpay/webhook";
    process.env.PALMPAY_CALLBACK_URL =
      "https://frontend.example.com/payment/callback";
    process.env.PALMPAY_BASE_URL = "https://open-gw-sandbox.palmpay-inc.com";

    const config = new PalmPayConfigService();
    const signatureService = new PalmPaySignatureService(config);
    const httpService = { post: jest.fn() };
    const userRepository = {
      findByPk: jest.fn(async () => ({ _id: 42, email: "buyer@example.com" })),
    };
    const guestCheckoutRepository = {
      findOne: jest.fn(async () => null as any),
    };
    const userCheckoutRepository = {
      findOne: jest.fn(async () => null as any),
    };
    const orderPlaceService = {
      prepareAuthenticatedCheckout: jest.fn(async () => ({
        verified: { data: { addressId: 12, amount: 1500 } },
        amount: 1500,
        amount_kobo: 150000,
        store_ids: [7],
      })),
    };
    const paystackService = {
      persistUserCheckoutInitialization: jest.fn(async () => undefined),
      persistGuestCheckoutInitialization: jest.fn(async () => undefined),
      finalizePaymentTransaction: jest.fn(async () => undefined),
    };
    const guestOrderService = {
      calculateGuestCartSubtotalNaira: jest.fn(async () => 1200),
    };
    const jwtService = {
      verifyAsync: jest.fn(async () => ({
        data: { amount: 50, tax: 0, discount: 0, isGuest: true },
      })),
    };
    const service = new PalmPayService(
      httpService as any,
      config,
      signatureService,
      userRepository as any,
      guestCheckoutRepository as any,
      userCheckoutRepository as any,
      orderPlaceService as any,
      paystackService as any,
      guestOrderService as any,
      jwtService as any
    );

    return {
      service,
      signatureService,
      httpService,
      guestCheckoutRepository,
      userCheckoutRepository,
      orderPlaceService,
      paystackService,
    };
  };

  const createOrderResponse = (reference: string) => ({
    respCode: "00000000",
    respMsg: "success",
    data: {
      orderNo: "2424220903032435363613",
      orderStatus: 0,
      checkoutUrl: "https://checkout.palmpay.example/order",
      payToken: "pay-token",
      orderAmount: 150000,
      currency: "NGN",
      orderId: reference,
    },
  });

  it("initializes an authenticated checkout with a signed PalmPay request", async () => {
    const { service, httpService, paystackService } = createService();
    httpService.post.mockReturnValue(
      of({ data: createOrderResponse("PPU123") })
    );

    const result = await service.initializeAuthenticatedCheckout(42, {
      reference: "PPU123",
      callback_url: "https://frontend.example.com/checkoutsuccess/3",
      order_payload: {
        payment: { type: "palmpay" },
        cart: [{ storeId: 7, products: [{ productId: 10, quantity: 2 }] }],
      } as any,
    });

    expect(result.data).toMatchObject({
      authorization_url: "https://checkout.palmpay.example/order",
      reference: "PPU123",
      provider_reference: "2424220903032435363613",
      amount: 1500,
    });
    const [, payload, options] = httpService.post.mock.calls[0] as any;
    expect(payload).toMatchObject({
      orderId: "PPU123",
      amount: 150000,
      currency: "NGN",
      notifyUrl: "https://api.example.com/palmpay/webhook",
      callBackUrl: "https://frontend.example.com/checkoutsuccess/3",
      version: "V1.1",
    });
    expect(payload.nonceStr).toMatch(/^[a-f0-9]{32}$/);
    expect(options.headers).toMatchObject({
      Authorization: "Bearer L123456",
      CountryCode: "NG",
    });
    expect(options.headers.Signature).toEqual(expect.any(String));
    expect(
      paystackService.persistUserCheckoutInitialization
    ).toHaveBeenCalledWith(
      "PPU123",
      expect.anything(),
      expect.anything(),
      expect.anything(),
      "palmpay"
    );
  });

  it("rejects a verified transaction whose amount differs from checkout", async () => {
    const { service, httpService, userCheckoutRepository } = createService();
    userCheckoutRepository.findOne.mockResolvedValue({
      amount_kobo: 150000,
      user_email: "buyer@example.com",
    });
    httpService.post.mockReturnValue(
      of({
        data: {
          respCode: "00000000",
          respMsg: "success",
          data: {
            orderId: "PPU123",
            orderNo: "2424220903032435363613",
            orderStatus: 2,
            amount: 100,
            currency: "NGN",
          },
        },
      })
    );

    await expect(service.verifyPayment("PPU123")).rejects.toThrow(
      "PalmPay payment amount mismatch"
    );
  });

  it("recomputes and persists the guest checkout amount", async () => {
    const { service, httpService, paystackService } = createService();
    httpService.post.mockReturnValue(
      of({ data: createOrderResponse("unused") })
    );

    const result = await service.initializeGuestPayment({
      payment_provider: "palmpay",
      guest_info: {
        email: "guest@example.com",
        first_name: "Guest",
        last_name: "Buyer",
        phone: "08000000000",
      },
      cart_items: [
        {
          product_id: 10,
          store_id: 7,
          quantity: 2,
          unit_price: 1,
        },
      ],
      amount: 1,
      delivery_charge: 0,
      currency: "NGN",
      callback_url: "https://frontend.example.com/guest/callback",
      order_payload: {
        delivery: { delivery_token: "signed-delivery-token" },
      } as any,
    });

    const [, payload] = httpService.post.mock.calls[0] as any;
    expect(payload.amount).toBe(125000);
    expect(result.data.reference).toMatch(/^PPG[A-Za-z0-9]+$/);
    expect(result.data.reference.length).toBeLessThanOrEqual(32);
    expect(
      paystackService.persistGuestCheckoutInitialization
    ).toHaveBeenCalledWith(
      result.data.reference,
      expect.anything(),
      125000,
      "palmpay"
    );
  });

  it("rejects a webhook with an invalid PalmPay signature", async () => {
    const { service, httpService, paystackService } = createService();

    await expect(
      service.processWebhook({
        orderId: "PPG123",
        appId: "L123456",
        orderStatus: 2,
        sign: "invalid",
      })
    ).rejects.toThrow("Invalid PalmPay webhook signature");

    expect(httpService.post).not.toHaveBeenCalled();
    expect(paystackService.finalizePaymentTransaction).not.toHaveBeenCalled();
  });

  it("verifies the callback, queries PalmPay, and finalizes a successful checkout", async () => {
    const {
      service,
      signatureService,
      httpService,
      guestCheckoutRepository,
      paystackService,
    } = createService();
    guestCheckoutRepository.findOne.mockResolvedValue({
      amount_kobo: 150000,
      guest_email: "guest@example.com",
    });
    httpService.post.mockReturnValue(
      of({
        data: {
          respCode: "00000000",
          respMsg: "success",
          data: {
            orderId: "PPG123",
            orderNo: "2424220903032435363613",
            orderStatus: 2,
            amount: 150000,
            currency: "NGN",
          },
        },
      })
    );
    const webhook: Record<string, any> = {
      orderId: "PPG123",
      orderNo: "2424220903032435363613",
      appId: "L123456",
      amount: 150000,
      currency: "NGN",
      orderStatus: 2,
    };
    webhook.sign = encodeURIComponent(signatureService.sign(webhook));

    await service.processWebhook(webhook);

    expect(paystackService.finalizePaymentTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        reference: "PPG123",
        amount: 150000,
        status: "success",
      }),
      "success",
      "palmpay"
    );
  });
});
