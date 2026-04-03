import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { BadRequestException } from "@nestjs/common";
import { GuestOrderService } from "./guest-order.service";
import { Products } from "../PRODUCTS/products.entity";

describe("GuestOrderService", () => {
  let service: GuestOrderService;
  let paystackService: { verifyPayment: any };
  let jwtService: { verifyAsync: any };

  beforeEach(() => {
    paystackService = {
      verifyPayment: jest.fn(),
    };

    jwtService = {
      verifyAsync: jest.fn(),
    };

    service = new GuestOrderService(
      {
        sequelize: {
          transaction: jest.fn(),
        },
      } as any,
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
});
