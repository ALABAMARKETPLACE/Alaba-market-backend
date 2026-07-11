import { afterEach, describe, expect, it, jest } from "@jest/globals";
import * as crypto from "crypto";
import { of, throwError } from "rxjs";
import { PaystackService } from "./paystack.service";
import { OrderPayments } from "../ORDER_PAYMENTS/order_payments.entity";
import { Order } from "../ORDER/order.entity";
import { OrderStatus } from "../ORDER_STATUS/order_status.entity";
import { OrderLog } from "../ORDER_LOG/orderlog.entity";
import { UniqueConstraintError } from "sequelize";

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

    const storeRepository = {
      findByPk: jest.fn(async () => null as any),
    };

    const paymentSplitService = {
      processPaymentWithSplit: jest.fn(async () => ({
        paystack: {
          authorization_url: "https://checkout.paystack.com/split",
          access_code: "ACCESS_SPLIT",
          reference: "split_ref_123",
        },
      })),
      syncPaymentStatusFromWebhook: jest.fn(async () => undefined),
    };

    const paystackAccountConfigService = {
      getHeaders: jest.fn(() => ({
        Authorization: `Bearer ${process.env.PAYSTACK_TEST_SECRET_KEY || process.env.PAYSTACK_SECRET_KEY || "sk_test_123456"}`,
        "Content-Type": "application/json",
      })),
      getAdminSplitPercentage: jest.fn(() => 6.5),
      getSellerFeeSurchargeKobo: jest.fn(() => 0),
      getDefaultAccountType: jest.fn(() => "default"),
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
      findOne: jest.fn(async () => null as any),
      create: jest.fn(async () => null as any),
    };

    const userCheckoutRepository = {
      findOne: jest.fn(async () => null as any),
      create: jest.fn(async () => null as any),
    };

    const webhookEventRepository = {
      create: jest.fn(async (payload: any) => ({
        ...payload,
        update: jest.fn(async (updates: any) => Object.assign(payload, updates)),
      })),
      findOne: jest.fn(async () => null as any),
    };

    const userRepository = {
      findByPk: jest.fn(async () => ({
        _id: 4625,
        email: "user@example.com",
      })),
    };

    const paymentLogRepository = {
      findOne: jest.fn(async () => null as any),
    };

    const guestOrderService = {
      createGuestOrder: jest.fn(async () => ({
        data: [],
      })),
      // Naira subtotal recomputed from product/variant records. Defaults to
      // 1500 to match the 150000-kobo amounts most guest-checkout fixtures
      // in this file use; override per test when a different total matters.
      calculateGuestCartSubtotalNaira: jest.fn(async () => 1500),
    };

    const orderPlaceService = {
      prepareAuthenticatedCheckout: jest.fn(async () => ({
        verified: { data: { amount: 1500, addressId: 12 } },
        amount: 1500,
        amount_kobo: 150000,
        store_ids: [7],
      }) as any),
      create: jest.fn(async () => ({
        data: [],
      })),
    };

    const service = new PaystackService(
      httpService as any,
      paystackAccountConfigService as any,
      storeRepository as any,
      guestCheckoutRepository as any,
      userCheckoutRepository as any,
      webhookEventRepository as any,
      userRepository as any,
      paymentLogRepository as any,
      paymentSplitService as any,
      {
        decode: jest.fn(),
        // Naira delivery charge from the verified token. Defaults to 50 to
        // match the 5000-kobo delivery_charge most fixtures here use.
        verifyAsync: jest.fn(async () => ({
          data: { amount: 50, tax: 0, discount: 0, isGuest: true },
        })),
      } as any,
      guestOrderService as any,
      orderPlaceService as any,
    );

    return {
      service,
      httpService,
      storeRepository,
      paystackAccountConfigService,
      paymentSplitService,
      guestCheckoutRepository,
      userCheckoutRepository,
      webhookEventRepository,
      userRepository,
      paymentLogRepository,
      guestOrderService,
      orderPlaceService,
    };
  };

  it("auto-applies split initialization for existing orders with active store subaccounts", async () => {
    const { service, paymentSplitService, storeRepository } = createService();

    jest.spyOn(Order, "findByPk").mockResolvedValue({
      id: 33,
      storeId: 7,
    } as any);
    storeRepository.findByPk.mockResolvedValue({
      id: 7,
      subaccount_status: "active",
      paystack_subaccount_code_new: "ACCT_NEW_123",
    });

    const result = await service.initializePayment({
      email: "buyer@example.com",
      amount: 150000,
      callback_url: "https://example.com/callback",
      order_id: 33,
    } as any);

    expect(paymentSplitService.processPaymentWithSplit).toHaveBeenCalledWith(
      33,
      expect.objectContaining({
        email: "buyer@example.com",
        amount: 150000,
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        authorization_url: "https://checkout.paystack.com/split",
      }),
    );
  });

  it("auto-applies direct split for authenticated single-store checkout", async () => {
    const { service, orderPlaceService, storeRepository } = createService();
    const initializeSplitSpy = jest
      .spyOn(service, "initializeSplitTransaction")
      .mockResolvedValue({
        authorization_url: "https://checkout.paystack.com/auth-single-store",
        access_code: "ACCESS_AUTH_SPLIT",
        reference: "auth_split_ref_123",
      } as any);

    orderPlaceService.prepareAuthenticatedCheckout.mockResolvedValue({
      verified: { data: { amount: 1500, addressId: 12 } },
      amount: 1500,
      amount_kobo: 150000,
      store_ids: [7],
      store_summaries: [
        {
          store_id: 7,
          product_total: 1500,
          discount: 0,
        },
      ],
    } as any);
    storeRepository.findByPk.mockResolvedValue({
      id: 7,
      subaccount_status: "active",
      paystack_subaccount_code_new: "ACCT_NEW_123",
    });

    const result = await service.initializeAuthenticatedCheckout(4625, {
      order_payload: {} as any,
      callback_url: "https://example.com/callback",
    } as any);

    expect(initializeSplitSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        store_id: 7,
        amount: 150000,
      }),
    );
    expect(result.data.reference).toBe("auth_split_ref_123");
  });

  it("auto-applies direct split for guest single-store checkout", async () => {
    const { service, storeRepository, guestCheckoutRepository } = createService();
    const initializeSplitSpy = jest
      .spyOn(service, "initializeSplitTransaction")
      .mockResolvedValue({
        authorization_url: "https://checkout.paystack.com/guest-single-store",
        access_code: "ACCESS_GUEST_SPLIT",
        reference: "guest_split_ref_123",
      } as any);

    storeRepository.findByPk.mockResolvedValue({
      id: 7,
      subaccount_status: "active",
      paystack_subaccount_code_new: "ACCT_NEW_123",
    });

    const result = await service.initializeGuestPayment({
      guest_info: {
        email: "guest@example.com",
        first_name: "Guest",
        last_name: "Buyer",
        phone: "08000000000",
      },
      amount: 150000,
      delivery_charge: 5000,
      callback_url: "https://example.com/guest/callback",
      cart_items: [
        {
          store_id: 7,
          product_id: 1,
          quantity: 1,
        },
      ],
      order_payload: {
        guest_info: {
          email: "guest@example.com",
          first_name: "Guest",
          last_name: "Buyer",
          phone: "08000000000",
        },
        delivery_address: {
          full_address: "12 Example Street",
        },
        delivery: {
          delivery_token: "token_123",
        },
        cart_items: [
          {
            store_id: 7,
            product_id: 1,
            quantity: 1,
          },
        ],
      },
    } as any);

    expect(initializeSplitSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        store_id: 7,
        amount: 155000,
      }),
    );
    expect(guestCheckoutRepository.create).toHaveBeenCalled();
    expect(result.data.reference).toBe("guest_split_ref_123");
  });

  it("normalizes camelCase guest cart item ids before persisting checkout payload", async () => {
    const { service, guestCheckoutRepository, storeRepository } = createService();

    jest.spyOn(service, "initializeSplitTransaction").mockResolvedValue({
      authorization_url: "https://checkout.paystack.com/guest-single-store",
      access_code: "ACCESS_GUEST_SPLIT",
      reference: "guest_split_ref_1386",
    } as any);

    storeRepository.findByPk.mockResolvedValue({
      id: 4548,
      subaccount_status: "active",
      paystack_subaccount_code_new: "ACCT_NEW_4548",
    });

    await service.initializeGuestPayment({
      guest_info: {
        email: "guest@example.com",
        first_name: "Guest",
        last_name: "Buyer",
        phone: "08000000000",
      },
      amount: 500000,
      delivery_charge: 0,
      callback_url: "https://example.com/guest/callback",
      cart_items: [
        {
          store_id: 4548,
          product_id: 1386,
          quantity: 1,
        },
      ],
      order_payload: {
        guest_info: {
          email: "guest@example.com",
          first_name: "Guest",
          last_name: "Buyer",
          phone: "08000000000",
        },
        delivery_address: {
          full_address: "12 Example Street",
        },
        delivery: {
          delivery_token: "token_123",
        },
        cart_items: [
          {
            storeId: 4548,
            productId: 1386,
            quantity: 1,
            unitPrice: 5000,
            name: "Iphone 17 Max",
          },
        ],
      },
    } as any);

    expect(guestCheckoutRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          cart_items: [
            expect.objectContaining({
              product_id: 1386,
              store_id: 4548,
              unit_price: 5000,
              product_name: "Iphone 17 Max",
            }),
          ],
        }),
      }),
    );
  });

  it("preserves guest product UUID pid values for webhook order creation", async () => {
    const { service, guestCheckoutRepository, storeRepository } = createService();

    jest.spyOn(service, "initializeSplitTransaction").mockResolvedValue({
      authorization_url: "https://checkout.paystack.com/guest-single-store",
      access_code: "ACCESS_GUEST_SPLIT",
      reference: "guest_split_ref_uuid",
    } as any);

    storeRepository.findByPk.mockResolvedValue({
      id: 4548,
      subaccount_status: "active",
      paystack_subaccount_code_new: "ACCT_NEW_4548",
    });

    await service.initializeGuestPayment({
      guest_info: {
        email: "guest@example.com",
        first_name: "Guest",
        last_name: "Buyer",
        phone: "08000000000",
      },
      amount: 500000,
      delivery_charge: 0,
      callback_url: "https://example.com/guest/callback",
      cart_items: [
        {
          store_id: 4548,
          product_id: 1386,
          quantity: 1,
        },
      ],
      order_payload: {
        guest_info: {
          email: "guest@example.com",
          first_name: "Guest",
          last_name: "Buyer",
          phone: "08000000000",
        },
        delivery_address: {
          full_address: "12 Example Street",
        },
        delivery: {
          delivery_token: "token_123",
        },
        cart_items: [
          {
            storeId: 4548,
            productId: "ae732c6e-8843-40d1-9aa3-b3ce075bd04e",
            quantity: 1,
            unitPrice: 5000,
            name: "Iphone 17 Max",
          },
        ],
      },
    } as any);

    expect(guestCheckoutRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          cart_items: [
            expect.objectContaining({
              product_id: undefined,
              product_pid: "ae732c6e-8843-40d1-9aa3-b3ce075bd04e",
              store_id: 4548,
              unit_price: 5000,
            }),
          ],
        }),
      }),
    );
  });

  it("auto-applies dynamic split for authenticated multi-store checkout when all stores are eligible", async () => {
    const { service, orderPlaceService, storeRepository } = createService();
    const initializeDynamicSplitSpy = jest
      .spyOn(service, "initializeDynamicSplitTransaction")
      .mockResolvedValue({
        authorization_url: "https://checkout.paystack.com/auth-multi-store",
        access_code: "ACCESS_AUTH_MULTI",
        reference: "auth_multi_split_ref_123",
      } as any);

    orderPlaceService.prepareAuthenticatedCheckout.mockResolvedValue({
      verified: { data: { amount: 1500, addressId: 12 } },
      amount: 1500,
      amount_kobo: 150000,
      store_ids: [7, 9],
      store_summaries: [
        {
          store_id: 7,
          product_total: 1000,
          discount: 0,
        },
        {
          store_id: 9,
          product_total: 500,
          discount: 0,
        },
      ],
    } as any);
    storeRepository.findByPk
      .mockResolvedValueOnce({
        id: 7,
        subaccount_status: "active",
        paystack_subaccount_code_new: "ACCT_NEW_007",
      })
      .mockResolvedValueOnce({
        id: 9,
        subaccount_status: "active",
        paystack_subaccount_code_new: "ACCT_NEW_009",
      });

    const result = await service.initializeAuthenticatedCheckout(4625, {
      order_payload: {} as any,
      callback_url: "https://example.com/callback",
    } as any);

    expect(initializeDynamicSplitSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 150000,
        paystack_account: "new",
        split: expect.objectContaining({
          type: "flat",
          bearer_type: "account",
          subaccounts: [
            expect.objectContaining({
              subaccount: "ACCT_NEW_007",
            }),
            expect.objectContaining({
              subaccount: "ACCT_NEW_009",
            }),
          ],
        }),
      }),
    );
    expect(result.data.reference).toBe("auth_multi_split_ref_123");
  });

  it("auto-applies dynamic split for guest multi-store checkout when all stores are eligible", async () => {
    const { service, storeRepository, guestCheckoutRepository } = createService();
    const initializeDynamicSplitSpy = jest
      .spyOn(service, "initializeDynamicSplitTransaction")
      .mockResolvedValue({
        authorization_url: "https://checkout.paystack.com/guest-multi-store",
        access_code: "ACCESS_GUEST_MULTI",
        reference: "guest_multi_split_ref_123",
      } as any);

    storeRepository.findByPk
      .mockResolvedValueOnce({
        id: 7,
        subaccount_status: "active",
        paystack_subaccount_code_new: "ACCT_NEW_007",
      })
      .mockResolvedValueOnce({
        id: 9,
        subaccount_status: "active",
        paystack_subaccount_code_new: "ACCT_NEW_009",
      });

    const result = await service.initializeGuestPayment({
      guest_info: {
        email: "guest@example.com",
        first_name: "Guest",
        last_name: "Buyer",
        phone: "08000000000",
      },
      amount: 150000,
      delivery_charge: 5000,
      callback_url: "https://example.com/guest/callback",
      cart_items: [
        {
          store_id: 7,
          product_id: 1,
          quantity: 1,
          unit_price: 1000,
        },
        {
          store_id: 9,
          product_id: 2,
          quantity: 1,
          unit_price: 500,
        },
      ],
      order_payload: {
        guest_info: {
          email: "guest@example.com",
          first_name: "Guest",
          last_name: "Buyer",
          phone: "08000000000",
        },
        delivery_address: {
          full_address: "12 Example Street",
        },
        delivery: {
          delivery_token: "token_123",
        },
        cart_items: [
          {
            store_id: 7,
            product_id: 1,
            quantity: 1,
            unit_price: 1000,
            total_price: 1000,
          },
          {
            store_id: 9,
            product_id: 2,
            quantity: 1,
            unit_price: 500,
            total_price: 500,
          },
        ],
      },
    } as any);

    expect(initializeDynamicSplitSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 155000,
        paystack_account: "new",
        split: expect.objectContaining({
          type: "flat",
          bearer_type: "account",
          subaccounts: [
            expect.objectContaining({
              subaccount: "ACCT_NEW_007",
            }),
            expect.objectContaining({
              subaccount: "ACCT_NEW_009",
            }),
          ],
        }),
      }),
    );
    expect(guestCheckoutRepository.create).toHaveBeenCalled();
    expect(result.data.reference).toBe("guest_multi_split_ref_123");
  });

  it("falls back to company account when guest multi-store split subaccounts are rejected", async () => {
    const { service, storeRepository, httpService } = createService();

    storeRepository.findByPk
      .mockResolvedValueOnce({
        id: 7,
        subaccount_status: "active",
        paystack_subaccount_code_new: "ACCT_NEW_007",
      })
      .mockResolvedValueOnce({
        id: 9,
        subaccount_status: "active",
        paystack_subaccount_code_new: "ACCT_NEW_009",
      });

    httpService.post.mockReturnValueOnce(
      throwError(() => ({
        response: {
          status: 400,
          data: {
            message: "Some subaccount(s) could not be found",
          },
        },
      })),
    );
    httpService.post.mockReturnValueOnce(
      of({
        data: {
          status: true,
          data: {
            authorization_url:
              "https://checkout.paystack.com/guest-multi-store-fallback",
            access_code: "ACCESS_GUEST_MULTI_FB",
            reference: "guest_multi_split_ref_fallback",
          },
        },
      }),
    );

    const result = await service.initializeGuestPayment({
      guest_info: {
        email: "guest@example.com",
        first_name: "Guest",
        last_name: "Buyer",
        phone: "08000000000",
      },
      amount: 150000,
      delivery_charge: 5000,
      callback_url: "https://example.com/guest/callback",
      cart_items: [
        {
          store_id: 7,
          product_id: 1,
          quantity: 1,
          unit_price: 1000,
        },
        {
          store_id: 9,
          product_id: 2,
          quantity: 1,
          unit_price: 500,
        },
      ],
      order_payload: {
        guest_info: {
          email: "guest@example.com",
          first_name: "Guest",
          last_name: "Buyer",
          phone: "08000000000",
        },
        delivery_address: {
          full_address: "12 Example Street",
        },
        delivery: {
          delivery_token: "token_123",
        },
        cart_items: [
          {
            store_id: 7,
            product_id: 1,
            quantity: 1,
            unit_price: 1000,
            total_price: 1000,
          },
          {
            store_id: 9,
            product_id: 2,
            quantity: 1,
            unit_price: 500,
            total_price: 500,
          },
        ],
      },
    } as any);

    expect(httpService.post).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("/transaction/initialize"),
      expect.objectContaining({
        metadata: expect.objectContaining({
          split_fallback: true,
          split_fallback_reason: "Some subaccount(s) could not be found",
          collection_mode: "company_account_no_subaccount",
        }),
      }),
      expect.any(Object),
    );
    expect(result.data.reference).toBe("guest_multi_split_ref_fallback");
  });

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
    const { service, paymentSplitService, webhookEventRepository } = createService();
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
    const eventLog: any = await webhookEventRepository.create.mock.results[0].value;
    expect(eventLog.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "completed",
        error: null,
        processed_at: expect.any(Date),
      }),
    );
  });

  it("does not reprocess completed duplicate webhook events", async () => {
    const { service, webhookEventRepository, paymentSplitService } = createService();
    process.env.NODE_ENV = "development";
    process.env.PAYSTACK_TEST_SECRET_KEY = "sk_test_123456";

    const existingEvent = {
      status: "completed",
      update: jest.fn(),
    };
    webhookEventRepository.create.mockRejectedValue(
      new UniqueConstraintError({ errors: [] }),
    );
    webhookEventRepository.findOne.mockResolvedValue(existingEvent);
    const paymentLookupSpy = jest.spyOn(OrderPayments, "findOne");

    const webhook = {
      event: "charge.success",
      data: {
        id: 12345,
        reference: "ps_ref_duplicate",
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
      message: "Duplicate webhook ignored",
    });

    expect(paymentLookupSpy).not.toHaveBeenCalled();
    expect(paymentSplitService.syncPaymentStatusFromWebhook).not.toHaveBeenCalled();
    expect(existingEvent.update).not.toHaveBeenCalled();
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

  it("can scan the old Paystack account during bulk reconciliation", async () => {
    const { service, httpService, paystackAccountConfigService } = createService();
    process.env.NODE_ENV = "development";
    process.env.PAYSTACK_TEST_SECRET_KEY = "sk_test_default";
    process.env.PAYSTACK_TEST_SECRET_KEY_OLD = "sk_test_old";

    paystackAccountConfigService.getHeaders.mockImplementation((account = "default") => ({
      Authorization:
        account === "old" ? "Bearer sk_test_old" : "Bearer sk_test_default",
      "Content-Type": "application/json",
    }));

    httpService.get.mockImplementation((_url: string, config: any) => {
      if (config?.headers?.Authorization === "Bearer sk_test_old") {
        return of({
          data: {
            status: true,
            data: [
              {
                reference: "ps_ref_old_account",
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
        });
      }

      return of({
        data: {
          status: true,
          data: [],
          meta: {
            page: 1,
            pageCount: 0,
          },
        },
      });
    });

    jest.spyOn(Order, "findAll").mockResolvedValue([] as any);
    jest.spyOn(OrderPayments, "findAll").mockResolvedValue([] as any);

    const result = await service.reconcileTransactions({
      dryRun: true,
      account: "old",
      page: 1,
      perPage: 10,
      maxPages: 1,
      status: "success",
    } as any);

    expect(paystackAccountConfigService.getHeaders).toHaveBeenCalledWith("old");
    expect(result.data.summary).toEqual(
      expect.objectContaining({
        total: 1,
        missingLocally: 1,
      }),
    );
    expect(result.data.results[0]).toEqual(
      expect.objectContaining({
        reference: "ps_ref_old_account",
        action: "missing",
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
