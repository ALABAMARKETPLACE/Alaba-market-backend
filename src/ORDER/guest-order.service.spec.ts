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

describe("GuestOrderService", () => {
  let service: GuestOrderService;
  let orderRepository: {
    sequelize: { transaction: any };
    findAndCountAll: any;
  };
  let paystackService: { verifyPayment: any };
  let jwtService: { verifyAsync: any; decode: any };

  beforeEach(() => {
    orderRepository = {
      sequelize: {
        transaction: jest.fn(),
      },
      findAndCountAll: jest.fn(),
    };

    paystackService = {
      verifyPayment: jest.fn(),
    };

    jwtService = {
      verifyAsync: jest.fn(),
      decode: jest.fn(),
    };

    service = new GuestOrderService(
      orderRepository as any,
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
    orderRepository.findAndCountAll.mockResolvedValue({
      count: 1,
      rows: [
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
      ],
    });

    const result = await service.getAllGuestOrders({
      page: 1,
      take: 10,
    } as any);

    const where = orderRepository.findAndCountAll.mock.calls[0][0].where;

    expect(where[Op.or]).toEqual([
      { is_guest_order: true },
      {
        [Op.and]: [
          { guest_email: { [Op.ne]: null } },
          { guest_email: { [Op.ne]: "" } },
        ],
      },
    ]);
    expect(result.data).toHaveLength(1);
  });
});
