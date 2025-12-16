import { Module } from "@nestjs/common";
import { PrintConfigerationService } from "./print_configeration.service";
import { PrintConfigerationController } from "./print_configeration.controller";
import { PrintConfigerationProvider } from "./print_configeration.provider";

@Module({
  imports: [],
  controllers: [PrintConfigerationController],
  providers: [PrintConfigerationService, ...PrintConfigerationProvider],
  exports: [PrintConfigerationService],
})
export class PrintConfigerationModule {}
