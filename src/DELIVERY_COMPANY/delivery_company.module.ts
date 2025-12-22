import { Module } from "@nestjs/common";
import { DeliveryCompanyController } from "./delivery_company.controller";
import { DeliveryCompanyService } from "./delivery_company.service";
import { DeliveryCompanyProvider } from "./delivery_company.provider";
import { DatabaseModule } from "../database/database.module";
import { UserProviders } from "../USERS/user.provider";
import { BcryptProvider } from "../shared/providers/bcrypt.provider";
import { OrderProvider } from "../ORDER/order.provider";
import { ImgcompressModule } from "../IMAGE_COMPRESS/img_compress.module";

@Module({
  imports: [DatabaseModule, ImgcompressModule],
  controllers: [DeliveryCompanyController],
  providers: [
    DeliveryCompanyService,
    ...DeliveryCompanyProvider,
    ...UserProviders,
    ...BcryptProvider,
    ...OrderProvider,
  ],
  exports: [DeliveryCompanyService],
})
export class DeliveryCompanyModule {}
