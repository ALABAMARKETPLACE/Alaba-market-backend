import { afterEach, describe, expect, it, jest } from "@jest/globals";
import * as crypto from "crypto";
import { of } from "rxjs";
import { PaystackService } from "./paystack.service";
import { OrderPayments } from "../ORDER_PAYMENTS/order_payments.entity";
import { Order } from "../ORDER/order.entity";
import { OrderStatus } from "../ORDER_STATUS/order_status.entity";

describe("PaystackService", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.PAYSTACK_SECRET_KEY;
    delete process.env.PAYSTACK_TEST_SECRET_KEY;
    delete process.env.PAYSTACK_PUBLIC_KEY;
    delete process.env.PAYSTACK_TEST_PUBLIC_KEY;
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

    const guestCheckoutRepository = {
      findOne: jest.fn(async () => null),
      create: jest.fn(async () => null),
    };

    const guestOrderService = {
      createGuestOrder: jest.fn(async () => ({
        data: [],
      })),
    };

    const service = new PaystackService(
      httpService as any,
      {} as any,
      guestCheckoutRepository as any,
      paymentSplitService as any,
      guestOrderService as any,
    );

    return {
      service,
      httpService,
      paymentSplitService,
      guestCheckoutRepository,
      guestOrderService,
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

    jest.spyOn(OrderPayments, "findOne")
      .mockResolvedValueOnce(payment as any)
      .mockResolvedValueOnce(payment as any);
    jest.spyOn(Order, "findByPk").mockResolvedValue(order as any);
    jest.spyOn(Order, "findOne").mockResolvedValue(null as any);
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

  it("rejects live Paystack public keys in development", () => {
    const { service } = createService();
    process.env.NODE_ENV = "development";
    process.env.PAYSTACK_PUBLIC_KEY = "pk_live_123456";

    expect(() => service.getPublicKey()).toThrow(
      "Development must use Paystack test public keys",
    );
  });
});
