import { Module } from "@nestjs/common";
import { ProductsController } from "./products.controller";
import { ProductsProviders } from "./products.provider";
import { ProductsService } from "./products.services";
import { ProductImageModule } from "../PRODUCT_IMAGE/productimage.module";
import { ProductVariantModule } from "../PRODUCT_VARIANTS/productvariant.module";
import { ProductUploadService } from "./product_upload_services";
import { SlugifyProvider } from "../shared/providers/slugify.provider";
@Module({
  imports: [ProductVariantModule, ProductImageModule],
  controllers: [ProductsController],
  providers: [
    ProductsService,
    ...ProductsProviders,
    ProductUploadService,
    ...SlugifyProvider,
  ],
  exports: [ProductsService, ...ProductsProviders],
})
export class ProductsModule {}
