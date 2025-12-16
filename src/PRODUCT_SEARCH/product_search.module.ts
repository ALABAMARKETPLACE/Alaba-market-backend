import { Module } from "@nestjs/common";
import { ProductSearchController } from "./product_search.controller";
import { CategoryModule } from "../CATEGORY/category.module";
import { SubCategoryModule } from "../SUB_CATEGORY/sub_category.module";
import { ProductsModule } from "../PRODUCTS/products.module";
import { StoreModule } from "../STORE/store.module";
import { FeaturedProductsModule } from "../FEATURED_PRODUCTS/featured-products.module";
import { ProductSearchServiceMulti } from "./product_search_multi";
import { ProductSearchServiceSingle } from "./product_search_single";
import { ProductServiceMain } from "./product_service_main";
import { ProductSearchStoreService } from "./product_search_store";
import { TopStoreService } from "./product_search_topstore";
import { SlugifyProvider } from "../shared/providers/slugify.provider";
import { SettingsProvider } from "../SETTINGS/settings.provider";

@Module({
  imports: [
    ProductsModule,
    CategoryModule,
    SubCategoryModule,
    StoreModule,
    FeaturedProductsModule,
  ],
  controllers: [ProductSearchController],
  providers: [
    ProductSearchServiceMulti,
    ProductSearchServiceSingle,
    ProductServiceMain,
    ProductSearchStoreService,
    TopStoreService,
    ...SlugifyProvider,
    ...SettingsProvider,
  ],
  exports: [
    ProductSearchServiceMulti,
    ProductSearchServiceSingle,
    ProductServiceMain,
    ProductSearchStoreService,
    TopStoreService,
  ],
})
export class ProductSearchModule {}
