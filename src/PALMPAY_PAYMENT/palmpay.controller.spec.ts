import { describe, expect, it, jest } from "@jest/globals";

import { PalmPayController } from "./palmpay.controller";

describe("PalmPayController", () => {
  it("acknowledges a processed webhook with exactly plain-text success", async () => {
    const service = {
      processWebhook: jest.fn(async () => undefined),
    };
    const controller = new PalmPayController(service as any);
    const response = {
      status: jest.fn(),
      type: jest.fn(),
      send: jest.fn(),
    };
    response.status.mockReturnValue(response);
    response.type.mockReturnValue(response);

    await controller.webhook(
      { orderId: "PPG123", sign: "signature" },
      response as any
    );

    expect(service.processWebhook).toHaveBeenCalledWith({
      orderId: "PPG123",
      sign: "signature",
    });
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.type).toHaveBeenCalledWith("text/plain");
    expect(response.send).toHaveBeenCalledWith("success");
  });
});
