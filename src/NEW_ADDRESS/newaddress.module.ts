import { Module } from "@nestjs/common";
import { NewAddressService } from "./newaddress.service";
import { NewAddressProviders } from "./newaddress.provider";
import { NewAddressController } from "./newaddress.controller";

@Module({
  imports: [],
  controllers: [NewAddressController],
  providers: [NewAddressService, ...NewAddressProviders],
  exports: [NewAddressService],
})
export class NewAddressModule {}
