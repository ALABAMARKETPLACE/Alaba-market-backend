import { Global, Module } from "@nestjs/common";
import { LoggerModule } from "nestjs-pino";
import { AppLogger } from "./app-logger.service";
import {
  createPinoDestination,
  createPinoHttpOptions,
} from "./pino.config";

const destination = createPinoDestination();

@Global()
@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: destination
        ? [createPinoHttpOptions(), destination]
        : createPinoHttpOptions(),
      assignResponse: true,
    }),
  ],
  providers: [AppLogger],
  exports: [AppLogger, LoggerModule],
})
export class LoggingModule {}
