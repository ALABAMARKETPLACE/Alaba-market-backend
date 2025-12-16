import { Module } from "@nestjs/common";
import { AddressService } from "./address.service";
import { AddressProviders } from "./address.provider";
import { AddressController } from "./address.controller";
@Module({
	imports: [],
	controllers: [AddressController],
	providers: [AddressService, ...AddressProviders],
	exports: [AddressService],
})
export class AddressModule {}
