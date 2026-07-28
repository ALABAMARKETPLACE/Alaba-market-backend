import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { OrderService } from "./order.service";

describe("OrderService", () => {
  let service: OrderService;
  let orderRepository: { findOne: any };
  let guestCheckoutRepository: { findOne: any };

  beforeEach(() => {
    orderRepository = {
      findOne: jest.fn(),
    };
    guestCheckoutRepository = {
      findOne: jest.fn(),
    };

    service = new OrderService(
      orderRepository as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      guestCheckoutRepository as any,
    );
  });

  it("returns customer-facing tracking details for initialized guest checkouts", async () => {
    orderRepository.findOne.mockResolvedValue(null);
    guestCheckoutRepository.findOne.mockResolvedValue({
      reference: "budpay_guest_1785134679119_eb5cc7ce",
      amount_kobo: 350000,
      status: "ready_for_webhook",
      payment_status: "pending",
      payload: {
        delivery_address: {
          full_address: "Igando Lagos",
          city: "Agege",
          state: "Lagos State",
          country: "Nigeria",
        },
        cart_items: [{ product_id: 8068 }, { product_id: 8069 }],
      },
    });

    const result = await service.trackOrderByReference(
      "budpay_guest_1785134679119_eb5cc7ce",
    );

    expect(result.message).toBe(
      "Payment is pending. Complete payment to confirm your order.",
    );
    expect(result.data).toEqual({
      reference: "budpay_guest_1785134679119_eb5cc7ce",
      order_status: "payment_pending",
      items_count: 2,
      total_amount: 3500,
      delivery_address: "Igando Lagos, Agege, Lagos State, Nigeria",
      estimated_delivery: null,
      tracking_updates: [],
    });
  });

  it("returns a processing status for paid guest checkouts awaiting order confirmation", async () => {
    orderRepository.findOne.mockResolvedValue(null);
    guestCheckoutRepository.findOne.mockResolvedValue({
      reference: "guest_123",
      amount_kobo: 12500,
      status: "ready_for_webhook",
      payment_status: "success",
      payload: {
        delivery_address: {},
        cart_items: [],
      },
    });

    const result = await service.trackOrderByReference("guest_123");

    expect(result.message).toBe(
      "Payment received. Your order is being confirmed.",
    );
    expect(result.data.order_status).toBe("processing");
  });
});
