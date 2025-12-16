import { Module } from "@nestjs/common";

import { SubCategoryController } from "./sub_category.controller";
import { SubCategoryProviders } from "./sub_category.provider";
import { SubCategoryService } from "./sub_category.services";
import { ProductsModule } from "../PRODUCTS/products.module";
import { SlugifyProvider } from "../shared/providers/slugify.provider";
import { CategoryModule } from "../CATEGORY/category.module";
@Module({
  imports: [ProductsModule, CategoryModule],
  controllers: [SubCategoryController],
  providers: [SubCategoryService, ...SubCategoryProviders, ...SlugifyProvider],
  exports: [SubCategoryService, ...SubCategoryProviders],
})
export class SubCategoryModule {}
