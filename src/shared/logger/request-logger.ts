import { LoggerService } from "@nestjs/common";

type RequestLoggerOptions = {
  logBodies?: boolean;
  logHeaders?: boolean;
  maxBodyLength?: number;
  redactKeys?: string[];
};

const DEFAULT_REDACT_KEYS = [
  "password",
  "pass",
  "pwd",
  "token",
  "access_token",
  "refresh_token",
  "authorization",
  "cookie",
  "set-cookie",
  "secret",
  "api_key",
  "apikey",
  "client_secret",
  "private_key",
];

const isObject = (value: unknown) =>
  typeof value === "object" && value !== null;

const redactValue = (value: unknown) => {
  if (Array.isArray(value)) return value.map(redactValue);
  if (!isObject(value)) return value;

  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    result[key] = redactValue(val);
  }
  return result;
};

const redactObject = (value: unknown, redactKeys: string[]) => {
  if (!isObject(value)) return value;
  const keys = new Set(redactKeys.map((k) => k.toLowerCase()));

  const walk = (val: unknown): unknown => {
    if (Array.isArray(val)) return val.map(walk);
    if (!isObject(val)) return val;
    const obj = val as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(obj)) {
      if (keys.has(key.toLowerCase())) {
        out[key] = "[REDACTED]";
      } else {
        out[key] = walk(v);
      }
    }
    return out;
  };

  return walk(value);
};

const safeStringify = (value: unknown, maxLength: number) => {
  const seen = new WeakSet();
  const json = JSON.stringify(
    value,
    (_, val) => {
      if (typeof val === "bigint") return val.toString();
      if (val instanceof Error) {
        return { message: val.message, stack: val.stack };
      }
      if (Buffer.isBuffer(val)) return val.toString("utf8");
      if (typeof val === "object" && val !== null) {
        if (seen.has(val)) return "[Circular]";
        seen.add(val);
      }
      return val;
    },
    2,
  );

  if (!json) return "";
  if (json.length <= maxLength) return json;
  return `${json.slice(0, maxLength)}...<truncated>`;
};

const nowMs = () => Date.now();

export const createRequestLogger = (
  logger: LoggerService,
  options?: RequestLoggerOptions,
) => {
  const logBodies = options?.logBodies ?? true;
  const logHeaders = options?.logHeaders ?? false;
  const maxBodyLength = options?.maxBodyLength ?? 10_000;
  const redactKeys = options?.redactKeys ?? DEFAULT_REDACT_KEYS;

  return (req: any, res: any, next: any) => {
    const start = nowMs();
    const requestId = `${start}-${Math.random().toString(36).slice(2, 8)}`;

    let resBody: unknown = undefined;

    const originalJson = res.json?.bind(res);
    const originalSend = res.send?.bind(res);

    if (originalJson) {
      res.json = (body: unknown) => {
        resBody = body;
        return originalJson(body);
      };
    }

    if (originalSend) {
      res.send = (body: unknown) => {
        resBody = body;
        return originalSend(body);
      };
    }

    const reqInfo: Record<string, unknown> = {
      id: requestId,
      method: req.method,
      url: req.originalUrl || req.url,
      ip: req.ip,
      params: req.params,
      query: req.query,
    };

    if (logHeaders) {
      reqInfo.headers = redactObject(req.headers, redactKeys);
    }

    if (logBodies) {
      reqInfo.body = redactObject(req.body, redactKeys);
    }

    logger.log(
      `REQ ${safeStringify(reqInfo, maxBodyLength)}`,
      "http",
    );

    res.on("finish", () => {
      const duration = nowMs() - start;
      const status = res.statusCode;
      const resInfo: Record<string, unknown> = {
        id: requestId,
        status,
        durationMs: duration,
      };

      if (logBodies) {
        resInfo.body = redactObject(resBody, redactKeys);
      }

      const line = `RES ${safeStringify(resInfo, maxBodyLength)}`;
      if (status >= 500) {
        logger.error(line, undefined, "http");
      } else if (status >= 400) {
        logger.warn(line, "http");
      } else {
        logger.log(line, "http");
      }
    });

    next();
  };
};

export const redactForLogs = (value: unknown, redactKeys?: string[]) => {
  if (!redactKeys || redactKeys.length === 0) return redactValue(value);
  return redactObject(value, redactKeys);
};
