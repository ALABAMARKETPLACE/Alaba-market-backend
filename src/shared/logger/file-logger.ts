import { LoggerService } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";

type ConsoleMethods = {
  log: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
};

type FileLoggerOptions = {
  logFilePath: string;
  errorLogFilePath?: string;
  warnLogFilePath?: string;
  appName?: string;
  mirrorToConsole?: boolean;
  consoleMethods?: ConsoleMethods;
  rotateDaily?: boolean;
};

const safeToString = (value: unknown): string => {
  if (value instanceof Error) {
    return value.stack || value.message;
  }
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value === null || value === undefined) return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return Object.prototype.toString.call(value);
  }
};

const formatArgs = (args: unknown[]): string =>
  args.map((arg) => safeToString(arg)).join(" ");

export class FileLogger implements LoggerService {
  private readonly logFilePath: string;
  private readonly errorLogFilePath?: string;
  private readonly warnLogFilePath?: string;
  private readonly appName?: string;
  private readonly mirrorToConsole: boolean;
  private readonly consoleMethods?: ConsoleMethods;
  private readonly rotateDaily: boolean;
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(options: FileLoggerOptions) {
    this.logFilePath = options.logFilePath;
    this.errorLogFilePath = options.errorLogFilePath;
    this.warnLogFilePath = options.warnLogFilePath;
    this.appName = options.appName;
    this.mirrorToConsole = options.mirrorToConsole ?? false;
    this.rotateDaily = options.rotateDaily ?? false;
    this.consoleMethods =
      options.consoleMethods ||
      (this.mirrorToConsole
        ? {
            log: console.log.bind(console),
            error: console.error.bind(console),
            warn: console.warn.bind(console),
            debug: console.debug.bind(console),
            info: console.info.bind(console),
          }
        : undefined);
    const dir = path.dirname(this.logFilePath);
    fs.mkdirSync(dir, { recursive: true });
    if (this.errorLogFilePath) {
      const errDir = path.dirname(this.errorLogFilePath);
      fs.mkdirSync(errDir, { recursive: true });
    }
    if (this.warnLogFilePath) {
      const warnDir = path.dirname(this.warnLogFilePath);
      fs.mkdirSync(warnDir, { recursive: true });
    }
  }

  log(message: any, context?: string) {
    this.write("LOG", safeToString(message), context);
  }

  error(message: any, trace?: string, context?: string) {
    const msg = safeToString(message);
    const full = trace ? `${msg}\n${trace}` : msg;
    this.write("ERROR", full, context);
  }

  warn(message: any, context?: string) {
    this.write("WARN", safeToString(message), context);
  }

  debug(message: any, context?: string) {
    this.write("DEBUG", safeToString(message), context);
  }

  verbose(message: any, context?: string) {
    this.write("VERBOSE", safeToString(message), context);
  }

  private write(level: string, message: string, context?: string) {
    const time = new Date().toISOString();
    const ctx = context ? `[${context}]` : "";
    const app = this.appName ? `[${this.appName}]` : "";
    const line = `${time} [${level}]${app}${ctx} ${message}`;
    const targetPath =
      level === "ERROR" && this.errorLogFilePath
        ? this.errorLogFilePath
        : level === "WARN" && this.warnLogFilePath
          ? this.warnLogFilePath
          : this.logFilePath;
    const logPath = this.rotateDaily
      ? this.applyDailyRotation(targetPath, time)
      : targetPath;

    this.writeQueue = this.writeQueue
      .then(() => fs.promises.appendFile(logPath, `${line}\n`))
      .catch(() => {
        // Swallow file logging errors to avoid crashing the app.
      });

    if (this.mirrorToConsole && this.consoleMethods) {
      if (level === "ERROR") {
        this.consoleMethods.error(line);
      } else if (level === "WARN") {
        this.consoleMethods.warn(line);
      } else if (level === "DEBUG") {
        this.consoleMethods.debug(line);
      } else {
        this.consoleMethods.log(line);
      }
    }
  }

  private applyDailyRotation(basePath: string, isoTime: string) {
    const date = isoTime.slice(0, 10);
    const dir = path.dirname(basePath);
    const ext = path.extname(basePath);
    const base = path.basename(basePath, ext);
    return path.join(dir, `${base}-${date}${ext || ".log"}`);
  }
}

export const patchConsole = (
  logger: LoggerService,
  options?: { forwardToConsole?: boolean },
) => {
  const forwardToConsole = options?.forwardToConsole ?? true;
  const original = {
    log: console.log.bind(console),
    error: console.error.bind(console),
    warn: console.warn.bind(console),
    debug: console.debug.bind(console),
    info: console.info.bind(console),
  };

  console.log = (...args: unknown[]) => {
    logger.log(formatArgs(args), "console");
    if (forwardToConsole) original.log(...args);
  };
  console.error = (...args: unknown[]) => {
    const msg = formatArgs(args);
    logger.error(msg, undefined, "console");
    if (forwardToConsole) original.error(...args);
  };
  console.warn = (...args: unknown[]) => {
    logger.warn(formatArgs(args), "console");
    if (forwardToConsole) original.warn(...args);
  };
  console.debug = (...args: unknown[]) => {
    logger.debug(formatArgs(args), "console");
    if (forwardToConsole) original.debug(...args);
  };
  console.info = (...args: unknown[]) => {
    logger.log(formatArgs(args), "console");
    if (forwardToConsole) original.info(...args);
  };

  return original;
};
