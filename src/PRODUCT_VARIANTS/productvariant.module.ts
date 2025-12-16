import { Module } from "@nestjs/common";
import { ProductVariantController } from "./productvariant.controller";
import { ProductVariantService } from "./productvariant.service";
import { ProductVariantProvider } from "./productvariant.provider";

@Module({
  imports: [],
  controllers: [ProductVariantController],
  providers: [ProductVariantService, ...ProductVariantProvider],
  exports: [ProductVariantService, ...ProductVariantProvider],
})
export class ProductVariantModule {}
