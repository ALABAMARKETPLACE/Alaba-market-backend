import * as fs from "fs";
import * as path from "path";
import { randomUUID } from "crypto";
import pino, { DestinationStream } from "pino";
import { Options as PinoHttpOptions } from "pino-http";

const REDACTED = "[REDACTED]";
const REQUEST_ID_HEADER = "x-request-id";
const CORRELATION_ID_HEADER = "x-correlation-id";

const redactPaths = [
  "req.headers.authorization",
  "req.headers.cookie",
  "req.headers['set-cookie']",
  "req.body",
  "res.headers['set-cookie']",
  "*.password",
  "*.password_confirmation",
  "*.currentPassword",
  "*.newPassword",
  "*.token",
  "*.accessToken",
  "*.access_token",
  "*.refreshToken",
  "*.refresh_token",
  "*.authorization",
  "*.secret",
  "*.secretKey",
  "*.privateKey",
  "*.card",
  "*.card_number",
  "*.cvv",
  "*.pin",
  "*.rawBody",
  "*.webhook_payload",
  "*.payload.password",
  "*.payload.token",
];

const safeRequestId = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return /^[a-zA-Z0-9._:-]{1,128}$/.test(trimmed) ? trimmed : null;
};

const normalizeUrl = (url: string | undefined): string => {
  if (!url) return "";
  return url.split("?")[0];
};

export function createPinoHttpOptions(): PinoHttpOptions {
  const isDevelopment = process.env.NODE_ENV !== "production";
  const slowRequestMs = Math.max(
    Number(process.env.LOG_SLOW_REQUEST_MS || 1000),
    1,
  );

  return {
    level: process.env.LOG_LEVEL || (isDevelopment ? "debug" : "info"),
    base: {
      service: process.env.APP_NAME || "alaba-market-backend",
      environment: process.env.NODE_ENV || "development",
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: {
      paths: redactPaths,
      censor: REDACTED,
      remove: false,
    },
    genReqId: (req, res) => {
      const incoming =
        safeRequestId(req.headers[REQUEST_ID_HEADER]) ||
        safeRequestId(req.headers[CORRELATION_ID_HEADER]);
      const requestId = incoming || randomUUID();
      res.setHeader(REQUEST_ID_HEADER, requestId);
      return requestId;
    },
    customAttributeKeys: {
      req: "request",
      res: "response",
      err: "error",
      responseTime: "durationMs",
    },
    serializers: {
      req(req) {
        const raw = req.raw as any;
        return {
          requestId: req.id,
          method: req.method,
          path: normalizeUrl(req.url),
          remoteAddress: req.remoteAddress,
          userAgent: raw?.headers?.["user-agent"],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
      err: pino.stdSerializers.err,
    },
    customProps: (req: any) => ({
      requestId: req.id,
      userId: req.user?.id ?? undefined,
      storeId: req.user?.storeId ?? undefined,
    }),
    customLogLevel: (_req, res, error) => {
      if (error || res.statusCode >= 500) return "error";
      if (res.statusCode >= 400) return "warn";
      return "info";
    },
    customSuccessMessage: (req, res, responseTime) =>
      responseTime >= slowRequestMs
        ? "slow request completed"
        : "request completed",
    customErrorMessage: () => "request failed",
    autoLogging: {
      ignore: (req) => normalizeUrl(req.url) === "/health",
    },
  };
}

export function createPinoDestination(): DestinationStream | undefined {
  const isDevelopment = process.env.NODE_ENV !== "production";

  const logFilePath =
    process.env.LOG_FILE_PATH ||
    path.join(process.cwd(), "logs", "backend.log");
  fs.mkdirSync(path.dirname(logFilePath), { recursive: true });

  if (isDevelopment) {
    const prettyConsoleStream = pino.transport({
      target: "pino-pretty",
      options: {
        colorize: true,
        singleLine: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
      },
    });

    return pino.multistream([
      { stream: prettyConsoleStream as DestinationStream },
      { stream: pino.destination({ dest: logFilePath, sync: false }) },
    ]);
  }

  return pino.multistream([
    { stream: process.stdout },
    { stream: pino.destination({ dest: logFilePath, sync: false }) },
  ]);
}

export function createBootstrapLogger() {
  const isDevelopment = process.env.NODE_ENV !== "production";

  return pino({
    level: process.env.LOG_LEVEL || (isDevelopment ? "debug" : "info"),
    base: {
      service: process.env.APP_NAME || "alaba-market-backend",
      environment: process.env.NODE_ENV || "development",
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: { paths: redactPaths, censor: REDACTED },
  }, createPinoDestination());
}
