import { afterEach, describe, expect, it, jest } from "@jest/globals";
import * as crypto from "crypto";
import { of } from "rxjs";
import { PaystackService } from "./paystack.service";
import { OrderPayments } from "../ORDER_PAYMENTS/order_payments.entity";
import { Order } from "../ORDER/order.entity";
import { OrderStatus } from "../ORDER_STATUS/order_status.entity";
import { OrderLog } from "../ORDER_LOG/orderlog.entity";

describe("PaystackService", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    (OrderLog as any).sequelize = undefined;
    delete process.env.PAYSTACK_SECRET_KEY;
    delete process.env.PAYSTACK_TEST_SECRET_KEY;
    delete process.env.PAYSTACK_SECRET_KEY_OLD;
    delete process.env.PAYSTACK_TEST_SECRET_KEY_OLD;
    delete process.env.PAYSTACK_SECRET_KEY_NEW;
    delete process.env.PAYSTACK_TEST_SECRET_KEY_NEW;
    delete process.env.PAYSTACK_PUBLIC_KEY;
    delete process.env.PAYSTACK_TEST_PUBLIC_KEY;
    delete process.env.PAYSTACK_PUBLIC_KEY_NEW;
    delete process.env.PAYSTACK_TEST_PUBLIC_KEY_NEW;
    delete process.env.NODE_ENV;
  });

  const createService = () => {
    const httpService = {
      get: jest.fn(),
      post: jest.fn(),
    };

    const paymentSplitService = {
      syncPaymentStatusFromWebhook: jest.fn(async () => undefined),
    };

    const paystackAccountConfigService = {
      getHeaders: jest.fn(() => ({
        Authorization: `Bearer ${process.env.PAYSTACK_TEST_SECRET_KEY || process.env.PAYSTACK_SECRET_KEY || "sk_test_123456"}`,
        "Content-Type": "application/json",
      })),
      getPublicKey: jest.fn(
        () =>
          process.env.PAYSTACK_TEST_PUBLIC_KEY ||
          process.env.PAYSTACK_PUBLIC_KEY ||
          "pk_test_123456",
      ),
      getWebhookSecretKeys: jest.fn(() => {
        const values = [
          process.env.PAYSTACK_TEST_SECRET_KEY,
          process.env.PAYSTACK_SECRET_KEY,
          process.env.PAYSTACK_TEST_SECRET_KEY_OLD,
          process.env.PAYSTACK_SECRET_KEY_OLD,
          process.env.PAYSTACK_TEST_SECRET_KEY_NEW,
          process.env.PAYSTACK_SECRET_KEY_NEW,
        ].filter(Boolean);

        return values.length > 0 ? values : ["sk_test_123456"];
      }),
    };

    const guestCheckoutRepository = {
      findOne: jest.fn(async () => null),
      create: jest.fn(async () => null),
    };

    const userCheckoutRepository = {
      findOne: jest.fn(async () => null),
      create: jest.fn(async () => null),
    };

    const userRepository = {
      findByPk: jest.fn(async () => ({
        _id: 4625,
        email: "user@example.com",
      })),
    };

    const paymentLogRepository = {
      findOne: jest.fn(async () => null),
    };

    const guestOrderService = {
      createGuestOrder: jest.fn(async () => ({
        data: [],
      })),
    };

    const orderPlaceService = {
      prepareAuthenticatedCheckout: jest.fn(async () => ({
        verified: { data: { amount: 1500, addressId: 12 } },
        amount: 1500,
        amount_kobo: 150000,
        store_ids: [7],
      })),
      create: jest.fn(async () => ({
        data: [],
      })),
    };

    const service = new PaystackService(
      httpService as any,
      paystackAccountConfigService as any,
      {} as any,
      guestCheckoutRepository as any,
      userCheckoutRepository as any,
      userRepository as any,
      paymentLogRepository as any,
      paymentSplitService as any,
      {
        decode: jest.fn(),
      } as any,
      guestOrderService as any,
      orderPlaceService as any,
    );

    return {
      service,
      httpService,
      paystackAccountConfigService,
      paymentSplitService,
      guestCheckoutRepository,
      userCheckoutRepository,
      userRepository,
      paymentLogRepository,
      guestOrderService,
      orderPlaceService,
    };
  };

  it("returns the full verification envelope from Paystack", async () => {
    process.env.NODE_ENV = "development";
    process.env.PAYSTACK_TEST_SECRET_KEY = "sk_test_123456";

    const apiResponse = {
      status: true,
      message: "Verification successful",
      data: {
        status: "success",
        reference: "guest_ref_123",
        amount: 12500,
        currency: "NGN",
        customer: {
          email: "guest@example.com",
        },
      },
    };

    const { service, httpService } = createService();
    httpService.get.mockReturnValue(of({ data: apiResponse }));

    await expect(
      service.verifyPayment({ reference: "guest_ref_123" }),
    ).resolves.toEqual(apiResponse);
  });

  it("rejects webhook payloads with an invalid signature", async () => {
    const { service } = createService();
    process.env.NODE_ENV = "development";
    process.env.PAYSTACK_TEST_SECRET_KEY = "sk_test_123456";

    await expect(
      service.processWebhook(
        {
          event: "charge.success",
          data: { reference: "ref_123" },
        } as any,
        "invalid-signature",
        JSON.stringify({ event: "charge.success", data: { reference: "ref_123" } }),
      ),
    ).rejects.toThrow("Invalid webhook signature");
  });

  it("updates order payment and order status on successful webhook events", async () => {
    const { service, paymentSplitService } = createService();
    process.env.NODE_ENV = "development";
    process.env.PAYSTACK_TEST_SECRET_KEY = "sk_test_123456";

    const payment = {
      orderId: 77,
      status: "pending",
      ref: "ps_ref_123",
      currency: null,
      cardHolder: null,
      update: jest.fn(async () => undefined),
    };

    const order = {
      id: 77,
      status: "pending",
      paymentType: "pay-online",
      guest_email: "guest@example.com",
      grandTotal: 1500,
      update: jest.fn(async () => undefined),
    };

    const latestStatus = null;
    const transaction = { LOCK: { UPDATE: "UPDATE" } };

    (OrderPayments as any).sequelize = {
      transaction: async (handler: any) => handler(transaction),
    };

    jest.spyOn(OrderPayments, "findOne").mockResolvedValue(payment as any);
    jest.spyOn(OrderPayments, "findAll").mockResolvedValue([] as any);
    jest.spyOn(Order, "findByPk").mockResolvedValue(null as any);
    jest.spyOn(Order, "findOne").mockResolvedValue(null as any);
    jest.spyOn(Order, "findAll").mockResolvedValue([order] as any);
    jest.spyOn(OrderPayments, "create").mockResolvedValue(payment as any);
    jest.spyOn(OrderStatus, "findOne").mockResolvedValue(latestStatus as any);
    const orderStatusCreateSpy = jest
      .spyOn(OrderStatus, "create")
      .mockResolvedValue({} as any);

    const webhook = {
      event: "charge.success",
      data: {
        reference: "ps_ref_123",
        amount: 150000,
        currency: "NGN",
        customer: {
          email: "guest@example.com",
        },
        metadata: {
          order_id: 77,
        },
      },
    };

    const rawPayload = JSON.stringify(webhook);
    const signature = crypto
      .createHmac("sha512", process.env.PAYSTACK_TEST_SECRET_KEY as string)
      .update(rawPayload)
      .digest("hex");

    await expect(
      service.processWebhook(webhook as any, signature, rawPayload),
    ).resolves.toEqual({
      status: "ok",
      message: "Webhook processed",
    });

    expect(payment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "success",
        currency: "NGN",
        cardHolder: "guest@example.com",
      }),
      expect.any(Object),
    );
    expect(order.update).toHaveBeenCalledWith(
      { status: "processing" },
      expect.any(Object),
    );
    expect(orderStatusCreateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: 77,
        status: "processing",
      }),
      expect.any(Object),
    );
    expect(paymentSplitService.syncPaymentStatusFromWebhook).toHaveBeenCalledWith(
      "ps_ref_123",
      webhook.data,
    );
  });

  it("reconciles all orders sharing one Paystack reference", async () => {
    const { service } = createService();
    process.env.NODE_ENV = "development";
    process.env.PAYSTACK_TEST_SECRET_KEY = "sk_test_123456";

    const paymentA = {
      orderId: 77,
      status: "pending",
      ref: "ps_ref_shared",
      currency: null,
      cardHolder: null,
      update: jest.fn(async () => undefined),
    };
    const paymentB = {
      orderId: 78,
      status: "pending",
      ref: "ps_ref_shared",
      currency: null,
      cardHolder: null,
      update: jest.fn(async () => undefined),
    };
    const orderA = {
      id: 77,
      status: "pending",
      paymentType: "pay-online",
      guest_email: null,
      grandTotal: 1000,
      update: jest.fn(async () => undefined),
    };
    const orderB = {
      id: 78,
      status: "pending",
      paymentType: "pay-online",
      guest_email: null,
      grandTotal: 500,
      update: jest.fn(async () => undefined),
    };
    const transaction = { LOCK: { UPDATE: "UPDATE" } };

    (OrderPayments as any).sequelize = {
      transaction: async (handler: any) => handler(transaction),
    };

    jest
      .spyOn(OrderPayments, "findOne")
      .mockResolvedValueOnce(paymentA as any)
      .mockResolvedValueOnce(paymentB as any);
    jest.spyOn(OrderPayments, "findAll").mockResolvedValue([] as any);
    jest.spyOn(Order, "findByPk").mockResolvedValue(null as any);
    jest.spyOn(Order, "findOne").mockResolvedValue(null as any);
    jest.spyOn(Order, "findAll").mockResolvedValue([orderA, orderB] as any);
    jest.spyOn(OrderStatus, "findOne").mockResolvedValue(null as any);
    const orderStatusCreateSpy = jest
      .spyOn(OrderStatus, "create")
      .mockResolvedValue({} as any);

    const webhook = {
      event: "charge.success",
      data: {
        reference: "ps_ref_shared",
        amount: 150000,
        currency: "NGN",
        customer: {
          email: "user@example.com",
        },
      },
    };

    const rawPayload = JSON.stringify(webhook);
    const signature = crypto
      .createHmac("sha512", process.env.PAYSTACK_TEST_SECRET_KEY as string)
      .update(rawPayload)
      .digest("hex");

    await service.processWebhook(webhook as any, signature, rawPayload);

    expect(paymentA.update).toHaveBeenCalled();
    expect(paymentB.update).toHaveBeenCalled();
    expect(orderA.update).toHaveBeenCalledWith(
      { status: "processing" },
      expect.any(Object),
    );
    expect(orderB.update).toHaveBeenCalledWith(
      { status: "processing" },
      expect.any(Object),
    );
    expect(orderStatusCreateSpy).toHaveBeenCalledTimes(2);
  });

  it("delegates public key resolution to the Paystack account config service", () => {
    const { service, paystackAccountConfigService } = createService();

    expect(service.getPublicKey()).toBe("pk_test_123456");
    expect(paystackAccountConfigService.getPublicKey).toHaveBeenCalled();
  });

  it("previews missing Paystack transactions without mutating local records", async () => {
    const { service, httpService } = createService();
    process.env.NODE_ENV = "development";
    process.env.PAYSTACK_TEST_SECRET_KEY = "sk_test_123456";

    httpService.get.mockReturnValue(
      of({
        data: {
          status: true,
          data: [
            {
              reference: "ps_ref_preview",
              status: "success",
              amount: 250000,
              currency: "NGN",
              customer: { email: "preview@example.com" },
            },
          ],
          meta: {
            page: 1,
            pageCount: 1,
          },
        },
      }),
    );

    jest.spyOn(Order, "findAll").mockResolvedValue([] as any);
    jest.spyOn(OrderPayments, "findAll").mockResolvedValue([] as any);
    const webhookSpy = jest.spyOn(
      service as any,
      "handlePaymentWebhookEvent",
    );

    const result = await service.reconcileTransactions({
      dryRun: true,
      page: 1,
      perPage: 10,
      maxPages: 1,
      status: "success",
    } as any);

    expect(webhookSpy).not.toHaveBeenCalled();
    expect(result.data.summary).toEqual(
      expect.objectContaining({
        total: 1,
        missingLocally: 1,
      }),
    );
    expect(result.data.results[0]).toEqual(
      expect.objectContaining({
        reference: "ps_ref_preview",
        action: "missing",
      }),
    );
  });

  it("replays reconcilable historical Paystack transactions through webhook sync", async () => {
    const { service, httpService, guestCheckoutRepository } = createService();
    process.env.NODE_ENV = "development";
    process.env.PAYSTACK_TEST_SECRET_KEY = "sk_test_123456";

    guestCheckoutRepository.findOne.mockResolvedValue({
      status: "ready_for_webhook",
      payload: { cart_items: [{ product_id: 1, quantity: 1 }] },
      order_ids: [],
    } as any);

    httpService.get.mockReturnValue(
      of({
        data: {
          status: true,
          data: [
            {
              reference: "ps_ref_sync",
              status: "success",
              amount: 250000,
              currency: "NGN",
              customer: { email: "sync@example.com" },
            },
          ],
          meta: {
            page: 1,
            pageCount: 1,
          },
        },
      }),
    );

    jest.spyOn(Order, "findAll").mockResolvedValue([] as any);
    jest.spyOn(OrderPayments, "findAll").mockResolvedValue([] as any);
    const webhookSpy = jest
      .spyOn(service as any, "handlePaymentWebhookEvent")
      .mockResolvedValue(undefined);

    const result = await service.reconcileTransactions({
      dryRun: false,
      page: 1,
      perPage: 10,
      maxPages: 1,
      status: "success",
    } as any);

    expect(webhookSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        reference: "ps_ref_sync",
      }),
      "success",
    );
    expect(result.data.summary).toEqual(
      expect.objectContaining({
        total: 1,
        reconciled: 1,
      }),
    );
    expect(result.data.results[0]).toEqual(
      expect.objectContaining({
        reference: "ps_ref_sync",
        action: "reconciled",
      }),
    );
  });

  it("rebuilds authenticated orders from payment logs during reconciliation", async () => {
    const {
      service,
      httpService,
      paymentLogRepository,
      orderPlaceService,
    } = createService();
    process.env.NODE_ENV = "development";
    process.env.PAYSTACK_TEST_SECRET_KEY = "sk_test_123456";

    paymentLogRepository.findOne.mockResolvedValue({
      userId: 4625,
      addressId: 12,
      ref: "ps_ref_paymentlog",
      cart: [
        {
          productId: 5,
          storeId: 7,
          quantity: 1,
        },
      ],
      charges: {
        data: {
          amount: 2500,
          addressId: 12,
          discount: 0,
          tax: 0,
        },
      },
    } as any);

    httpService.get.mockReturnValue(
      of({
        data: {
          status: true,
          data: [
            {
              reference: "ps_ref_paymentlog",
              status: "success",
              amount: 250000,
              currency: "NGN",
              customer: { email: "sync@example.com" },
            },
          ],
          meta: {
            page: 1,
            pageCount: 1,
          },
        },
      }),
    );

    jest.spyOn(Order, "findAll").mockResolvedValue([] as any);
    jest.spyOn(OrderPayments, "findAll").mockResolvedValue([] as any);
    const webhookSpy = jest
      .spyOn(service as any, "handlePaymentWebhookEvent")
      .mockResolvedValue(undefined);

    await service.reconcileTransactions({
      dryRun: false,
      page: 1,
      perPage: 10,
      maxPages: 1,
      status: "success",
    } as any);

    expect(orderPlaceService.create).toHaveBeenCalledWith(
      4625,
      expect.objectContaining({
        payment: expect.objectContaining({
          ref: "ps_ref_paymentlog",
        }),
        address: { id: 12 },
      }),
      expect.objectContaining({
        skipDeliveryTokenVerification: true,
        verifiedChargesData: expect.objectContaining({
          data: expect.objectContaining({
            addressId: 12,
          }),
        }),
      }),
    );
    expect(webhookSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        reference: "ps_ref_paymentlog",
      }),
      "success",
    );
  });

  it("rebuilds authenticated orders from order logs during reconciliation", async () => {
    const { service, httpService, orderPlaceService } = createService();
    process.env.NODE_ENV = "development";
    process.env.PAYSTACK_TEST_SECRET_KEY = "sk_test_123456";

    (OrderLog as any).sequelize = {
      escape: (value: string) => `'${value}'`,
      literal: (value: string) => value,
    };

    jest.spyOn(OrderLog, "findOne").mockResolvedValue({
      userId: 4625,
      address: { id: 12 },
      cart: [
        {
          productId: 5,
          storeId: 7,
          quantity: 1,
        },
      ],
      payment: {
        type: "paystack",
      },
      charges: {
        data: {
          amount: 2500,
          addressId: 12,
          discount: 0,
          tax: 0,
        },
      },
    } as any);

    httpService.get.mockReturnValue(
      of({
        data: {
          status: true,
          data: [
            {
              reference: "ps_ref_orderlog",
              status: "success",
              amount: 250000,
              currency: "NGN",
              customer: { email: "sync@example.com" },
            },
          ],
          meta: {
            page: 1,
            pageCount: 1,
          },
        },
      }),
    );

    jest.spyOn(Order, "findAll").mockResolvedValue([] as any);
    jest.spyOn(OrderPayments, "findAll").mockResolvedValue([] as any);
    const webhookSpy = jest
      .spyOn(service as any, "handlePaymentWebhookEvent")
      .mockResolvedValue(undefined);

    await service.reconcileTransactions({
      dryRun: false,
      page: 1,
      perPage: 10,
      maxPages: 1,
      status: "success",
    } as any);

    expect(orderPlaceService.create).toHaveBeenCalledWith(
      4625,
      expect.objectContaining({
        payment: expect.objectContaining({
          ref: "ps_ref_orderlog",
        }),
        address: { id: 12 },
      }),
      expect.objectContaining({
        skipDeliveryTokenVerification: true,
        verifiedChargesData: expect.objectContaining({
          data: expect.objectContaining({
            addressId: 12,
          }),
        }),
      }),
    );
    expect(webhookSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        reference: "ps_ref_orderlog",
      }),
      "success",
    );
  });

  it("rebuilds guest orders from Paystack metadata when no guest checkout row exists", async () => {
    const { service, httpService, guestOrderService } = createService();
    process.env.NODE_ENV = "development";
    process.env.PAYSTACK_TEST_SECRET_KEY = "sk_test_123456";

    httpService.get.mockReturnValue(
      of({
        data: {
          status: true,
          data: [
            {
              reference: "guest_ref_metadata",
              status: "success",
              amount: 500000,
              currency: "NGN",
              customer: { email: "guest@example.com" },
              metadata: {
                guest_order_payload: {
                  guest_info: {
                    email: "guest@example.com",
                    first_name: "Guest",
                    last_name: "User",
                    phone: "08000000000",
                  },
                  delivery_address: {
                    id: "guest_1",
                    full_name: "Guest User",
                    phone_no: "08000000000",
                    full_address: "12 Test Street",
                    city: "Lagos",
                    state: "Lagos",
                    state_id: 1,
                    country: "Nigeria",
                    country_id: 1,
                  },
                  cart_items: [
                    {
                      product_id: 1,
                      store_id: 7,
                      quantity: 1,
                      unit_price: 5000,
                    },
                  ],
                  delivery: {
                    delivery_token: "guest-token",
                    delivery_charge: 0,
                  },
                  payment: {
                    payment_status: "success",
                  },
                },
              },
            },
          ],
          meta: {
            page: 1,
            pageCount: 1,
          },
        },
      }),
    );

    jest.spyOn(Order, "findAll").mockResolvedValue([] as any);
    jest.spyOn(OrderPayments, "findAll").mockResolvedValue([] as any);
    const webhookSpy = jest
      .spyOn(service as any, "handlePaymentWebhookEvent")
      .mockResolvedValue(undefined);

    await service.reconcileTransactions({
      dryRun: false,
      page: 1,
      perPage: 10,
      maxPages: 1,
      status: "success",
    } as any);

    expect(guestOrderService.createGuestOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        payment: expect.objectContaining({
          payment_reference: "guest_ref_metadata",
        }),
        guest_info: expect.objectContaining({
          email: "guest@example.com",
        }),
      }),
      expect.objectContaining({
        skipPaymentVerification: true,
        verifiedPaymentData: expect.objectContaining({
          reference: "guest_ref_metadata",
        }),
      }),
    );
    expect(webhookSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        reference: "guest_ref_metadata",
      }),
      "success",
    );
  });

  it("diagnoses why a transaction is not recoverable", async () => {
    const { service, httpService } = createService();
    process.env.NODE_ENV = "development";
    process.env.PAYSTACK_TEST_SECRET_KEY = "sk_test_123456";

    httpService.get.mockReturnValue(
      of({
        data: {
          status: true,
          data: {
            reference: "guest_ref_missing",
            status: "success",
            amount: 5000,
            currency: "NGN",
            customer: { email: "missing@example.com" },
            metadata: {},
          },
        },
      }),
    );

    jest.spyOn(Order, "findAll").mockResolvedValue([] as any);
    jest.spyOn(OrderPayments, "findAll").mockResolvedValue([] as any);

    const result = await service.diagnoseTransaction("guest_ref_missing");

    expect(result.data.local).toEqual(
      expect.objectContaining({
        existsLocally: false,
        reconcilable: false,
      }),
    );
    expect(result.data.sources.recovery).toEqual(
      expect.objectContaining({
        overallRecoverable: false,
      }),
    );
    expect(result.data.guidance.missingPieces).toEqual(
      expect.arrayContaining([
        "guest_checkout",
        "payment_log",
        "orders",
        "order_payments",
      ]),
    );
  });
});
