import { Module } from "@nestjs/common";
import { PrintStatusService } from "./print_status.service";
import { PrintStatusProvider } from "./print_status.provider";
import { PrintStatusController } from "./print_status.controller";
@Module({
  imports: [],
  controllers: [PrintStatusController],
  providers: [PrintStatusService,...PrintStatusProvider],
  exports: [PrintStatusService],
})
export class PrintStatusModule {}
