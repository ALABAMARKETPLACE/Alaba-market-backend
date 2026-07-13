import { Logger } from "@nestjs/common";

const SENSITIVE_KEY =
  /password|passphrase|token|authorization|cookie|secret|private.?key|api.?key|card|cvv|pin|raw.?body|webhook.?payload/i;
const SENSITIVE_MESSAGE =
  /password|authorization|secret key|private key|raw body|webhook payload|card data|cvv|access token|refresh token|delivery token/i;
const JWT_PATTERN = /\beyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\b/g;
const SECRET_PATTERN = /\b(?:sk|pk)_(?:live|test)_[a-zA-Z0-9_-]+\b/g;
const BEARER_PATTERN = /Bearer\s+[a-zA-Z0-9._~+/=-]+/gi;

const sanitizeString = (value: string): string =>
  value
    .replace(JWT_PATTERN, "[REDACTED_JWT]")
    .replace(SECRET_PATTERN, "[REDACTED_KEY]")
    .replace(BEARER_PATTERN, "Bearer [REDACTED]");

const sanitize = (
  value: unknown,
  seen = new WeakSet<object>(),
): unknown => {
  if (typeof value === "string") return sanitizeString(value);
  if (
    value === null ||
    value === undefined ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  if (value instanceof Error) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((entry) => sanitize(entry, seen));
  }
  if (typeof value !== "object") {
    return String(value);
  }
  if (seen.has(value)) return "[Circular]";
  seen.add(value);

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
      key,
      SENSITIVE_KEY.test(key) ? "[REDACTED]" : sanitize(entry, seen),
    ]),
  );
};

export function createStructuredLogger(module: string) {
  const logger = new Logger(module);

  const normalize = (args: unknown[]) => {
    const [first, ...rest] = args;
    const objectFirst =
      typeof first === "object" && first !== null && !(first instanceof Error);
    const message =
      typeof first === "string"
        ? sanitizeString(first)
        : objectFirst && typeof rest[0] === "string"
          ? sanitizeString(rest[0])
          : "application event";
    const metadata =
      objectFirst
        ? (sanitize(first) as Record<string, unknown>)
        : rest.length > 0 && !SENSITIVE_MESSAGE.test(message)
          ? { details: sanitize(rest.length === 1 ? rest[0] : rest) }
          : {};
    const error = args.find((entry) => entry instanceof Error) as
      | Error
      | undefined;

    return {
      message,
      fields: {
        module,
        ...metadata,
        ...(error ? { err: error } : {}),
      },
    };
  };

  return {
    debug: (...args: unknown[]) => {
      const entry = normalize(args);
      logger.debug(entry.fields, entry.message);
    },
    info: (...args: unknown[]) => {
      const entry = normalize(args);
      logger.log(entry.fields, entry.message);
    },
    warn: (...args: unknown[]) => {
      const entry = normalize(args);
      logger.warn(entry.fields, entry.message);
    },
    error: (...args: unknown[]) => {
      const entry = normalize(args);
      logger.error(entry.fields, entry.message);
    },
  };
}
