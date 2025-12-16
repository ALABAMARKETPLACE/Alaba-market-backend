import { Module } from "@nestjs/common";
import { CategoryModule } from "../CATEGORY/category.module";
import { SubCategoryModule } from "../SUB_CATEGORY/sub_category.module";
import { ProductsModule } from "../PRODUCTS/products.module";
import { StoreModule } from "../STORE/store.module";
import { StoreSearchServices } from "./store_search.service";
import { SearchStoreController } from "./store_search.controller";
import { SettingsProvider } from "../SETTINGS/settings.provider";

@Module({
  imports: [
    ProductsModule,
    CategoryModule,
    SubCategoryModule,
    StoreModule,
  ],
  controllers: [SearchStoreController],
  providers: [StoreSearchServices,...SettingsProvider],
  exports: [StoreSearchServices],
})
export class StoreSearchModule {}
