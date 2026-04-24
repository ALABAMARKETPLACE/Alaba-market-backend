import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { BadRequestException } from "@nestjs/common";
import { Op } from "sequelize";
import { GuestOrderService } from "./guest-order.service";
import { Products } from "../PRODUCTS/products.entity";
import { OrderStatus } from "../ORDER_STATUS/order_status.entity";
import { Store } from "../STORE/store.entity";
import { DataResponseDto } from "../shared/dto/data-response-dto";

describe("GuestOrderService", () => {
  let service: GuestOrderService;
  let orderRepository: {
    sequelize: { transaction: any };
    findAndCountAll: any;
    findAll: any;
    findByPk: any;
    findOne: any;
  };
  let guestCheckoutRepository: { findAll: any };
  let paystackService: { verifyPayment: any };
  let jwtService: { verifyAsync: any; decode: any };

  beforeEach(() => {
    orderRepository = {
      sequelize: {
        transaction: jest.fn(),
      },
      findAndCountAll: jest.fn(),
      findAll: jest.fn(),
      findByPk: jest.fn(),
      findOne: jest.fn(),
    };

    const findAll = jest.fn();
    (findAll as any).mockResolvedValue([]);
    guestCheckoutRepository = { findAll };

    paystackService = {
      verifyPayment: jest.fn(),
    };

    jwtService = {
      verifyAsync: jest.fn(),
      decode: jest.fn(),
    };

    service = new GuestOrderService(
      orderRepository as any,
      guestCheckoutRepository as any,
      paystackService as any,
      {} as any,
      {} as any,
      jwtService as any,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("accepts guest delivery tokens verified against the selected address", async () => {
    jwtService.verifyAsync.mockResolvedValue({
      data: {
        isGuest: true,
        addressId: "guest_123",
        amount: 2500,
      },
      exp: Math.floor(Date.now() / 1000) + 300,
    });

    const result = await (service as any).basicCheck({
      guest_info: {
        email: "guest@example.com",
        first_name: "Jane",
        last_name: "Doe",
      },
      cart_items: [{ product_id: 1, quantity: 1 }],
      delivery_address: {
        id: "guest_123",
        state_id: 1,
        full_address: "12 Test Street",
      },
      payment: {
        payment_reference: "guest_ref_123",
      },
      delivery: {
        delivery_token: "signed-token",
      },
    });

    expect(jwtService.verifyAsync).toHaveBeenCalledWith("signed-token");
    expect(result.data.addressId).toBe("guest_123");
  });

  it("accepts expired guest delivery tokens during trusted replay", async () => {
    jwtService.decode.mockReturnValue({
      data: {
        isGuest: true,
        addressId: "guest_123",
        amount: 2500,
      },
      exp: Math.floor(Date.now() / 1000) - 300,
    });

    const result = await (service as any).basicCheck(
      {
        guest_info: {
          email: "guest@example.com",
          first_name: "Jane",
          last_name: "Doe",
        },
        cart_items: [{ product_id: 1, quantity: 1 }],
        delivery_address: {
          id: "guest_123",
          state_id: 1,
          full_address: "12 Test Street",
        },
        payment: {
          payment_reference: "guest_ref_123",
        },
        delivery: {
          delivery_token: "expired-token",
        },
      },
      {
        skipDeliveryTokenVerification: true,
      },
    );

    expect(jwtService.decode).toHaveBeenCalledWith("expired-token");
    expect(result.data.addressId).toBe("guest_123");
  });

  it("derives store_id from the product when the guest payload omits it", async () => {
    jest.spyOn(Products, "findOne").mockResolvedValue({
      _id: 10,
      store_id: 7,
      status: true,
      name: "Phone",
    } as any);

    const result = await (service as any).groupProducts(
      [
        {
          product_id: 10,
          quantity: 2,
          product_name: "Phone",
        },
      ],
      {} as any,
    );

    expect(result).toEqual([
      {
        storeId: 7,
        products: [
          expect.objectContaining({
            productId: 10,
            quantity: 2,
            productName: "Phone",
          }),
        ],
      },
    ]);
  });

  it("resolves a guest product UUID pid into the internal numeric product id", async () => {
    jest.spyOn(Products, "findOne").mockResolvedValue({
      _id: 10,
      pid: "ae732c6e-8843-40d1-9aa3-b3ce075bd04e",
      store_id: 7,
      status: true,
      name: "Phone",
    } as any);

    const result = await (service as any).groupProducts(
      [
        {
          product_pid: "ae732c6e-8843-40d1-9aa3-b3ce075bd04e",
          quantity: 1,
          product_name: "Phone",
        },
      ],
      {} as any,
    );

    expect(Products.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          pid: "ae732c6e-8843-40d1-9aa3-b3ce075bd04e",
        },
      }),
    );
    expect(result).toEqual([
      {
        storeId: 7,
        products: [
          expect.objectContaining({
            productId: 10,
            quantity: 1,
            productName: "Phone",
          }),
        ],
      },
    ]);
  });

  it("falls back to a unique store and item metadata match when guest payload lost the product id", async () => {
    jest.spyOn(Products, "findOne").mockResolvedValue(null);
    jest.spyOn(Products, "findAll").mockResolvedValue([
      {
        _id: 13197,
        pid: "ae732c6e-8843-40d1-9aa3-b3ce075bd04e",
        store_id: 4548,
        status: true,
        name: "Iphone 17 Max",
        image:
          "https://bairuha-bucket.s3.ap-south-1.amazonaws.com/alabamarketplace/1771582286947.jpg",
      } as any,
    ]);

    const result = await (service as any).groupProducts(
      [
        {
          quantity: 1,
          store_id: 4548,
          product_name: "Iphone 17 Max",
          image:
            "https://bairuha-bucket.s3.ap-south-1.amazonaws.com/alabamarketplace/1771582286947.jpg",
        },
      ],
      {} as any,
    );

    expect(Products.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          store_id: 4548,
          name: "Iphone 17 Max",
          image:
            "https://bairuha-bucket.s3.ap-south-1.amazonaws.com/alabamarketplace/1771582286947.jpg",
        },
      }),
    );
    expect(result).toEqual([
      {
        storeId: 4548,
        products: [
          expect.objectContaining({
            productId: 13197,
            quantity: 1,
            productName: "Iphone 17 Max",
          }),
        ],
      },
    ]);
  });

  it("verifies successful guest payments using the full Paystack response envelope", async () => {
    paystackService.verifyPayment.mockResolvedValue({
      status: true,
      data: {
        status: "success",
        amount: 12500,
        customer: {
          email: "guest@example.com",
        },
      },
    });

    await expect(
      (service as any).verifyPaymentReference(
        "guest_ref_123",
        12500,
        "guest@example.com",
      ),
    ).resolves.toBeUndefined();
  });

  it("rejects guest payments when the verified amount does not match", async () => {
    paystackService.verifyPayment.mockResolvedValue({
      status: true,
      data: {
        status: "success",
        amount: 9000,
        customer: {
          email: "guest@example.com",
        },
      },
    });

    await expect(
      (service as any).verifyPaymentReference(
        "guest_ref_123",
        12500,
        "guest@example.com",
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("fetches guest orders using guest_email even when is_guest_order was not set", async () => {
    orderRepository.findAll.mockResolvedValue([
        {
          id: 55,
          order_id: "ORD-55",
          status: "pending",
          guest_email: "guest@example.com",
          guest_first_name: "Jane",
          guest_last_name: "Doe",
          guest_phone: "08000000000",
          delivery_full_name: "Jane Doe",
          delivery_phone: "08000000000",
          delivery_address: "12 Test Street",
          delivery_city: "Lagos",
          delivery_state: "Lagos",
          delivery_state_id: 1,
          delivery_country: "Nigeria",
          delivery_country_id: 1,
          delivery_landmark: null,
          delivery_address_type: "home",
          guest_country_code: "+234",
          storeDetails: null,
          orderItems: [],
          orderPayment: null,
          orderStatus: [],
          totalItems: 1,
          total: 1000,
          deliveryCharge: 0,
          discount: 0,
          tax: 0,
          grandTotal: 1000,
          createdAt: new Date(),
        },
      ]);

    const result = await service.getAllGuestOrders({
      page: 1,
      take: 10,
    } as any);

    const where = orderRepository.findAll.mock.calls[0][0].where;

    expect(where[Op.or]).toEqual([
      { is_guest_order: true },
      {
        [Op.and]: [
          { guest_email: { [Op.ne]: null } },
          { guest_email: { [Op.ne]: "" } },
        ],
      },
      { userId: null },
      { userId: 0 },
    ]);
    expect(guestCheckoutRepository.findAll).toHaveBeenCalled();
    expect(result.data).toHaveLength(1);
  });

  it("includes successful guest checkouts that were paid but never became orders", async () => {
    orderRepository.findAll
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    guestCheckoutRepository.findAll.mockResolvedValue([
      {
        id: 901,
        reference: "guest_checkout_ref_901",
        guest_email: "guest@example.com",
        amount_kobo: 12500,
        status: "ready_for_webhook",
        payment_status: "success",
        error: null,
        payload: {
          guest_info: {
            first_name: "Jane",
            last_name: "Doe",
            phone: "08000000000",
          },
          delivery_address: {
            full_name: "Jane Doe",
            phone_no: "08000000000",
            full_address: "12 Test Street",
            city: "Lagos",
            state: "Lagos",
            state_id: 1,
            country: "Nigeria",
            country_id: 1,
            address_type: "home",
            country_code: "+234",
          },
          cart_items: [
            {
              product_id: 10,
              store_id: 7,
              quantity: 2,
              unit_price: 6250,
              product_name: "Phone",
            },
          ],
        },
        createdAt: new Date("2026-04-23T10:00:00.000Z"),
      },
    ]);

    jest.spyOn(Products, "findOne").mockResolvedValue(null as any);
    const storeFindAllSpy = jest.spyOn(Store, "findAll").mockResolvedValue([
      {
        id: 7,
        store_name: "Phone Store",
        email: "store@example.com",
      } as any,
    ]);

    const result = await service.getAllGuestOrders({
      page: 1,
      take: 10,
    } as any);

    expect(storeFindAllSpy).toHaveBeenCalled();
    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toEqual(
      expect.objectContaining({
        record_type: "orphaned_guest_checkout",
        order_id: "guest_checkout_ref_901",
        status: "payment_received_processing",
        checkout_status: "ready_for_webhook",
        guest_email: "guest@example.com",
        payment: expect.objectContaining({
          ref: "guest_checkout_ref_901",
          status: "success",
        }),
        status_remark:
          "Payment was successful and is awaiting backend order finalization.",
        store: expect.objectContaining({
          id: 7,
        }),
      }),
    );
  });

  it("reconciles a paid orphaned guest checkout from stored payload", async () => {
    const checkoutUpdate = jest.fn();
    (checkoutUpdate as any).mockResolvedValue(undefined);

    (guestCheckoutRepository as any).findByPk = jest.fn();
    (guestCheckoutRepository as any).findByPk.mockResolvedValue({
      id: 901,
      reference: "guest_checkout_ref_901",
      payment_status: "success",
      status: "failed",
      payload: {
        guest_info: {
          email: "guest@example.com",
          first_name: "Jane",
          last_name: "Doe",
          phone: "08000000000",
        },
        delivery_address: {
          id: "guest_123",
          state_id: 1,
          full_address: "12 Test Street",
        },
        payment: {
          payment_reference: "guest_checkout_ref_901",
        },
        delivery: {
          delivery_token: "signed-token",
        },
        cart_items: [
          {
            product_pid: "ae732c6e-8843-40d1-9aa3-b3ce075bd04e",
            quantity: 1,
            store_id: 7,
            unit_price: 6250,
            product_name: "Phone",
          },
        ],
        order_summary: {
          total: 62.5,
        },
      },
      update: checkoutUpdate,
    });

    paystackService.verifyPayment.mockResolvedValue({
      status: true,
      data: {
        status: "success",
        reference: "guest_checkout_ref_901",
        amount: 6250,
        customer: {
          email: "guest@example.com",
        },
      },
    });

    jest.spyOn(service, "createGuestOrder").mockResolvedValue(
      new DataResponseDto(
        [
          {
            id: 77,
            order_id: 800077,
          },
        ],
        true,
        "Created 1 order(s) for 1 seller(s)",
      ),
    );

    const result = await service.reconcileGuestCheckout(901);

    expect(paystackService.verifyPayment).toHaveBeenCalledWith({
      reference: "guest_checkout_ref_901",
    });
    expect(service.createGuestOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        payment: expect.objectContaining({
          payment_reference: "guest_checkout_ref_901",
          payment_status: "success",
        }),
      }),
      expect.objectContaining({
        skipPaymentVerification: true,
        skipDeliveryTokenVerification: true,
      }),
    );
    expect(checkoutUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "completed",
        order_ids: [77],
      }),
    );
    expect(result.message).toBe("Guest checkout reconciled successfully");
  });

  it("bulk reconciles paid orphaned guest checkouts and summarizes outcomes", async () => {
    const firstUpdate = jest.fn();
    const secondUpdate = jest.fn();
    (firstUpdate as any).mockResolvedValue(undefined);
    (secondUpdate as any).mockResolvedValue(undefined);

    guestCheckoutRepository.findAll.mockResolvedValue([
      {
        id: 901,
        reference: "guest_checkout_ref_901",
        payment_status: "success",
        status: "failed",
        payload: {
          guest_info: {
            email: "guest@example.com",
            first_name: "Jane",
            last_name: "Doe",
            phone: "08000000000",
          },
          delivery_address: {
            id: "guest_123",
            state_id: 1,
            full_address: "12 Test Street",
          },
          payment: {
            payment_reference: "guest_checkout_ref_901",
          },
          delivery: {
            delivery_token: "signed-token",
          },
          cart_items: [
            {
              product_pid: "ae732c6e-8843-40d1-9aa3-b3ce075bd04e",
              quantity: 1,
              store_id: 7,
              unit_price: 6250,
              product_name: "Phone",
            },
          ],
          order_summary: {
            total: 62.5,
          },
        },
        update: firstUpdate,
      },
      {
        id: 902,
        reference: "guest_checkout_ref_902",
        payment_status: "success",
        status: "failed",
        payload: {},
        update: secondUpdate,
      },
    ]);

    orderRepository.findAll
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    paystackService.verifyPayment.mockResolvedValue({
      status: true,
      data: {
        status: "success",
        reference: "guest_checkout_ref_901",
        amount: 6250,
        customer: {
          email: "guest@example.com",
        },
      },
    });

    jest.spyOn(service, "createGuestOrder").mockResolvedValue(
      new DataResponseDto(
        [
          {
            id: 77,
            order_id: 800077,
          },
        ],
        true,
        "Created 1 order(s) for 1 seller(s)",
      ),
    );

    const result = await service.reconcileAllGuestCheckouts();

    expect(result.data.summary).toEqual({
      total: 2,
      reconciled: 1,
      skipped: 1,
      failed: 0,
    });
    expect(result.data.results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 901,
          reference: "guest_checkout_ref_901",
          action: "reconciled",
        }),
        expect.objectContaining({
          id: 902,
          reference: "guest_checkout_ref_902",
          action: "skipped",
        }),
      ]),
    );
  });

  it("updates a guest order when the route receives the business order_id", async () => {
    const save = jest.fn();
    (save as any).mockResolvedValue(undefined);
    const getOrderPayment = jest.fn();
    (getOrderPayment as any).mockResolvedValue(null);

    jest.spyOn(OrderStatus, "create").mockResolvedValue({} as any);

    orderRepository.sequelize.transaction.mockImplementation(async (handler) =>
      handler({
        afterCommit: jest.fn(),
      }),
    );
    orderRepository.findByPk.mockResolvedValue(null);
    orderRepository.findOne.mockResolvedValue({
      id: 55,
      order_id: 800055,
      status: "pending",
      userId: null,
      guest_email: "guest@example.com",
      paymentType: "pay-online",
      save,
      getOrderPayment,
    });

    const result = await service.updateGuestOrder(800055, {
      status: "processing",
      remark: "Packed for dispatch",
    } as any);

    expect(orderRepository.findByPk).toHaveBeenCalledWith(
      800055,
      expect.objectContaining({
        transaction: expect.anything(),
      }),
    );
    expect(orderRepository.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { order_id: 800055 },
        transaction: expect.anything(),
      }),
    );
    expect(save).toHaveBeenCalled();
    expect(result.status).toBe(true);
    expect(result.data.status).toBe("processing");
  });
});
