import { Injectable } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";

export type LogMetadata = Record<string, unknown>;

@Injectable()
export class AppLogger {
  constructor(private readonly logger: PinoLogger) {}

  assign(metadata: LogMetadata): void {
    this.logger.assign(this.compact(metadata));
  }

  debug(module: string, message: string, metadata: LogMetadata = {}): void {
    this.logger.debug(this.fields(module, metadata), message);
  }

  info(module: string, message: string, metadata: LogMetadata = {}): void {
    this.logger.info(this.fields(module, metadata), message);
  }

  warn(module: string, message: string, metadata: LogMetadata = {}): void {
    this.logger.warn(this.fields(module, metadata), message);
  }

  error(
    module: string,
    message: string,
    error?: unknown,
    metadata: LogMetadata = {},
  ): void {
    this.logger.error(
      this.fields(module, {
        ...metadata,
        ...(error ? { err: this.toError(error) } : {}),
      }),
      message,
    );
  }

  private fields(module: string, metadata: LogMetadata): LogMetadata {
    return this.compact({ module, ...metadata });
  }

  private compact(metadata: LogMetadata): LogMetadata {
    return Object.fromEntries(
      Object.entries(metadata).filter(([, value]) => value !== undefined),
    );
  }

  private toError(error: unknown): Error {
    return error instanceof Error ? error : new Error(String(error));
  }
}
