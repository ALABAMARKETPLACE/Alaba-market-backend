import { createPinoHttpOptions } from "./pino.config";

describe("Pino logging configuration", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it("preserves a valid correlation ID and returns it as X-Request-Id", () => {
    process.env.NODE_ENV = "production";
    const options = createPinoHttpOptions();
    const setHeader = jest.fn();
    const requestId = options.genReqId!(
      {
        headers: { "x-correlation-id": "checkout-123" },
      } as any,
      { setHeader } as any,
    );

    expect(requestId).toBe("checkout-123");
    expect(setHeader).toHaveBeenCalledWith("x-request-id", "checkout-123");
  });

  it("generates a request ID when an incoming ID is unsafe", () => {
    const options = createPinoHttpOptions();
    const setHeader = jest.fn();
    const requestId = options.genReqId!(
      {
        headers: { "x-request-id": "unsafe request id" },
      } as any,
      { setHeader } as any,
    );

    expect(requestId).toMatch(/^[0-9a-f-]{36}$/);
    expect(setHeader).toHaveBeenCalledWith("x-request-id", requestId);
  });

  it("serializes request metadata without headers, query strings, or bodies", () => {
    const options = createPinoHttpOptions();
    const serialized = options.serializers!.req({
      id: "request-123",
      method: "POST",
      url: "/budpay/webhook?secret=hidden",
      remoteAddress: "127.0.0.1",
      raw: {
        headers: {
          authorization: "Bearer hidden",
          "user-agent": "jest",
        },
        body: { token: "hidden" },
      },
    } as any);

    expect(serialized).toEqual({
      requestId: "request-123",
      method: "POST",
      path: "/budpay/webhook",
      remoteAddress: "127.0.0.1",
      userAgent: "jest",
    });
  });
});
