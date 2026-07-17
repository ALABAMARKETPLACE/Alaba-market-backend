import { afterEach, describe, expect, it, jest } from "@jest/globals";
import * as crypto from "crypto";
import { of } from "rxjs";

import { BudPayService } from "./budpay.service";

describe("BudPayService", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.BUDPAY_SECRET_KEY;
    delete process.env.BUDPAY_BASE_URL;
    delete process.env.BUDPAY_WEBHOOK_SECRET;
    delete process.env.FRONTEND_URL;
  });

  const createService = () => {
    process.env.BUDPAY_SECRET_KEY = "budpay_test_secret";
    process.env.BUDPAY_BASE_URL = "https://api.budpay.com/api/v2";
    process.env.FRONTEND_URL = "https://frontend.example.com";

    const httpService = {
      post: jest.fn(),
      get: jest.fn(),
    };
    const userRepository = {
      findByPk: jest.fn(async () => ({
        _id: 42,
        email: "buyer@example.com",
      })),
    };
    const guestCheckoutRepository = {
      findOne: jest.fn(async () => null as any),
    };
    const userCheckoutRepository = {
      findOne: jest.fn(async () => null as any),
    };
    const storeRepository = {
      findByPk: jest.fn(async () => ({
        id: 7,
        budpay_customer_id: 1007,
      })),
    };
    const budPayAccountConfigService = {
      getBaseUrl: jest.fn(() => "https://api.budpay.com/api/v2"),
      getHeaders: jest.fn(() => ({
        Authorization: "Bearer budpay_test_secret",
        "Content-Type": "application/json",
      })),
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

    const service = new BudPayService(
      httpService as any,
      userRepository as any,
      guestCheckoutRepository as any,
      userCheckoutRepository as any,
      storeRepository as any,
      budPayAccountConfigService as any,
      orderPlaceService as any,
      paystackService as any,
      guestOrderService as any,
      jwtService as any,
    );

    return {
      service,
      httpService,
      userRepository,
      guestCheckoutRepository,
      userCheckoutRepository,
      orderPlaceService,
      paystackService,
      guestOrderService,
      jwtService,
    };
  };

  const initializationResponse = (reference: string) => ({
    status: true,
    message: "Authorization URL created",
    data: {
      authorization_url: "https://www.budpay.com/checkout/access-code",
      access_code: "access-code",
      reference,
    },
  });

  it("initializes authenticated checkout using the Paystack-compatible payload", async () => {
    const {
      service,
      httpService,
      orderPlaceService,
      paystackService,
    } = createService();
    httpService.post.mockReturnValue(
      of({ data: initializationResponse("budpay_user_ref_123") }),
    );

    const orderPayload = { payment: { type: "budpay" } } as any;
    const result = await service.initializeAuthenticatedCheckout(42, {
      order_payload: orderPayload,
      callback_url: "https://frontend.example.com/payment/callback",
      reference: "budpay_user_ref_123",
    });

    expect(orderPlaceService.prepareAuthenticatedCheckout).toHaveBeenCalledWith(
      42,
      orderPayload,
    );
    expect(httpService.post).toHaveBeenCalledWith(
      "https://api.budpay.com/api/v2/transaction/initialize",
      expect.objectContaining({
        email: "buyer@example.com",
        amount: "1500",
        currency: "NGN",
        reference: "budpay_user_ref_123",
        callback: "https://frontend.example.com/payment/callback",
      }),
      expect.any(Object),
    );
    expect(
      paystackService.persistUserCheckoutInitialization,
    ).toHaveBeenCalledWith(
      "budpay_user_ref_123",
      expect.objectContaining({ _id: 42 }),
      expect.any(Object),
      expect.objectContaining({ amount_kobo: 150000 }),
      "budpay",
    );
    expect(result).toEqual({
      status: true,
      message: "Payment initialized for checkout",
      data: {
        authorization_url: "https://www.budpay.com/checkout/access-code",
        access_code: "access-code",
        reference: "budpay_user_ref_123",
        amount: 1500,
      },
    });
  });

  it("initializes guest checkout using the Paystack-compatible payload", async () => {
    const { service, httpService, paystackService } = createService();
    httpService.post.mockReturnValue(
      of({ data: initializationResponse("budpay_guest_ref_123") }),
    );

    const result = await service.initializeGuestPayment({
      guest_info: {
        email: "guest@example.com",
        first_name: "Guest",
        last_name: "Buyer",
        phone: "08000000000",
      },
      cart_items: [
        { product_id: 1, store_id: 7, quantity: 1, unit_price: 120000 },
      ],
      amount: 120000,
      delivery_charge: 5000,
      callback_url: "https://frontend.example.com/guest/callback",
      order_payload: {
        delivery: { delivery_token: "signed-delivery-token" },
      } as any,
    });

    expect(httpService.post).toHaveBeenCalledWith(
      "https://api.budpay.com/api/v2/transaction/initialize",
      expect.objectContaining({
        email: "guest@example.com",
        amount: "1250",
        callback: "https://frontend.example.com/guest/callback",
      }),
      expect.any(Object),
    );
    expect(
      paystackService.persistGuestCheckoutInitialization,
    ).toHaveBeenCalledWith(
      expect.stringMatching(/^budpay_guest_/),
      expect.any(Object),
      125000,
      "budpay",
    );
    expect(result).toEqual(
      expect.objectContaining({
        status: true,
        message: "Payment initialized for guest checkout",
        data: expect.objectContaining({ amount: 1250 }),
      }),
    );
  });

  it("ignores a tampered client amount and charges the DB-recomputed total instead", async () => {
    const { service, httpService } = createService();
    httpService.post.mockReturnValue(
      of({ data: initializationResponse("budpay_guest_ref_456") }),
    );

    // Client claims a 1 kobo cart with no delivery charge; the mocked
    // guestOrderService/jwtService still report the real 1200 + 50 total.
    const result = await service.initializeGuestPayment({
      guest_info: {
        email: "guest@example.com",
        first_name: "Guest",
        last_name: "Buyer",
        phone: "08000000000",
      },
      cart_items: [
        { product_id: 1, store_id: 7, quantity: 1, unit_price: 1 },
      ],
      amount: 1,
      delivery_charge: 0,
      callback_url: "https://frontend.example.com/guest/callback",
      order_payload: {
        delivery: { delivery_token: "signed-delivery-token" },
      } as any,
    });

    expect(httpService.post).toHaveBeenCalledWith(
      "https://api.budpay.com/api/v2/transaction/initialize",
      expect.objectContaining({ amount: "1250" }),
      expect.any(Object),
    );
    expect(result.data.amount).toBe(1250);
  });

  it("uses a public HTTPS callback when the client sends a localhost callback", async () => {
    const { service, httpService } = createService();
    process.env.FRONTEND_URL = "http://localhost:3000";
    httpService.post.mockReturnValue(
      of({ data: initializationResponse("budpay_guest_ref_789") }),
    );

    await service.initializeGuestPayment({
      guest_info: {
        email: "guest@example.com",
        first_name: "Guest",
        last_name: "Buyer",
        phone: "08000000000",
      },
      cart_items: [
        { product_id: 1, store_id: 7, quantity: 1, unit_price: 120000 },
      ],
      amount: 120000,
      delivery_charge: 0,
      callback_url: "http://localhost:3000/checkoutsuccess/2",
      order_payload: {
        delivery: { delivery_token: "signed-delivery-token" },
      } as any,
    });

    expect(httpService.post).toHaveBeenCalledWith(
      "https://api.budpay.com/api/v2/transaction/initialize",
      expect.objectContaining({
        amount: "1250",
        callback: "https://dev.alabamarketplace.ng/checkoutsuccess/2",
      }),
      expect.any(Object),
    );
  });

  it("rejects guest checkout when the delivery token is missing", async () => {
    const { service } = createService();

    await expect(
      service.initializeGuestPayment({
        guest_info: {
          email: "guest@example.com",
          first_name: "Guest",
          last_name: "Buyer",
          phone: "08000000000",
        },
        cart_items: [
          { product_id: 1, store_id: 7, quantity: 1, unit_price: 120000 },
        ],
        amount: 120000,
        delivery_charge: 5000,
        callback_url: "https://frontend.example.com/guest/callback",
        order_payload: {} as any,
      }),
    ).rejects.toThrow("Delivery charge token is required");
  });


  it("returns the full BudPay verification envelope and validates checkout data", async () => {
    const {
      service,
      httpService,
      guestCheckoutRepository,
    } = createService();
    guestCheckoutRepository.findOne.mockResolvedValue({
      reference: "budpay_guest_ref_123",
      guest_email: "guest@example.com",
      amount_kobo: 125000,
    });
    httpService.get.mockReturnValue(
      of({
        data: {
          status: true,
          message: "Transaction verified successfully",
          data: {
            status: "success",
            reference: "budpay_guest_ref_123",
            amount: "1252.5",
            requested_amount: "1250",
            currency: "NGN",
            customer: { email: "GUEST@example.com" },
          },
        },
      }),
    );

    await expect(
      service.verifyPayment({ reference: "budpay_guest_ref_123" }),
    ).resolves.toEqual({
      status: true,
      message: "Transaction verified successfully",
      data: expect.objectContaining({
        status: "success",
        reference: "budpay_guest_ref_123",
        amount: 125000,
        provider_amount: 1252.5,
        customer: { email: "guest@example.com" },
      }),
    });
  });

  it("server-verifies a successful webhook and delegates shared finalization", async () => {
    const {
      service,
      httpService,
      guestCheckoutRepository,
      paystackService,
    } = createService();
    guestCheckoutRepository.findOne.mockResolvedValue({
      reference: "budpay_guest_ref_123",
      guest_email: "guest@example.com",
      amount_kobo: 125000,
    });
    httpService.get.mockReturnValue(
      of({
        data: {
          status: true,
          message: "Transaction verified successfully",
          data: {
            status: "success",
            reference: "budpay_guest_ref_123",
            amount: "1250",
            currency: "NGN",
            customer: { email: "guest@example.com" },
          },
        },
      }),
    );
    const webhook = {
      notify: "transaction",
      notifyType: "successful",
      data: {
        reference: "budpay_guest_ref_123",
        amount: "1250",
        currency: "NGN",
        status: "success",
        customer: { email: "guest@example.com" },
      },
    };

    await expect(
      service.processWebhook(webhook, undefined, JSON.stringify(webhook)),
    ).resolves.toEqual({ status: "ok", message: "Webhook processed" });
    expect(paystackService.finalizePaymentTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        reference: "budpay_guest_ref_123",
        amount: 125000,
        status: "success",
        metadata: expect.objectContaining({ payment_provider: "budpay" }),
      }),
      "success",
      "budpay",
    );
  });

  it("rejects invalid webhook signatures when a signing secret is configured", async () => {
    const { service } = createService();
    process.env.BUDPAY_WEBHOOK_SECRET = "webhook-secret";
    const webhook = {
      notify: "transaction",
      notifyType: "successful",
      data: { reference: "budpay_guest_ref_123" },
    };
    const rawPayload = JSON.stringify(webhook);
    const validSignature = crypto
      .createHmac("sha512", process.env.BUDPAY_WEBHOOK_SECRET)
      .update(rawPayload)
      .digest("hex");

    expect(validSignature).not.toBe("invalid-signature");
    await expect(
      service.processWebhook(webhook, "invalid-signature", rawPayload),
    ).rejects.toThrow("Invalid webhook signature");
  });
});
