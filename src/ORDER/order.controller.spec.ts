import { NotFoundException } from "@nestjs/common";
import {
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { OrderController } from "./order.controller";

describe("OrderController", () => {
  const create = {
    status: "processing",
    remark: "Packed for dispatch",
  } as any;

  const makeController = () => {
    const orderService = {
      updateOrder: jest.fn() as any,
    };
    const guestOrderService = {
      updateGuestOrder: jest.fn() as any,
    };

    const controller = new OrderController(
      orderService as any,
      {} as any,
      guestOrderService as any,
      {} as any,
    );

    return { controller, orderService, guestOrderService };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("updates regular orders from the standard route", async () => {
    const { controller, orderService, guestOrderService } = makeController();
    const expected = { status: true, data: { id: 2, status: "processing" } };

    orderService.updateOrder.mockResolvedValue(expected);

    await expect(controller.updateStatus(2, create)).resolves.toEqual(expected);
    expect(orderService.updateOrder).toHaveBeenCalledWith(2, create);
    expect(guestOrderService.updateGuestOrder).not.toHaveBeenCalled();
  });

  it("falls back to the guest order updater when the standard route misses", async () => {
    const { controller, orderService, guestOrderService } = makeController();
    const expected = { status: true, data: { id: 2, status: "processing" } };

    orderService.updateOrder.mockRejectedValue(new NotFoundException());
    guestOrderService.updateGuestOrder.mockResolvedValue(expected);

    await expect(controller.updateStatus(2, create)).resolves.toEqual(expected);
    expect(orderService.updateOrder).toHaveBeenCalledWith(2, create);
    expect(guestOrderService.updateGuestOrder).toHaveBeenCalledWith(2, create);
  });
});
