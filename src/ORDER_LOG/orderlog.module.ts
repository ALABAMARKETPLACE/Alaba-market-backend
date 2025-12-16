import { Module } from "@nestjs/common";
import { OrderLoggingService } from "./orderlog.service";
import { OrderLogProvider } from "./orderlog.provider";

@Module({
  imports: [],
  controllers: [],
  providers: [OrderLoggingService, ...OrderLogProvider],
  exports: [OrderLoggingService],
})
export class OrderLogModule {}
