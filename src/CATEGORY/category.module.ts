import { Module } from "@nestjs/common";
import { CategoryService } from "./category.services";
import { CategoryProviders } from "./category.provider";
import { CategoryController } from "./category.controller";
@Module({
  imports: [],
  controllers: [CategoryController],
  providers: [CategoryService, ...CategoryProviders],
  exports: [CategoryService, ...CategoryProviders],
})
export class CategoryModule {}
