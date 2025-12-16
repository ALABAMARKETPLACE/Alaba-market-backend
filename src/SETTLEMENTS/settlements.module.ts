import { Module } from "@nestjs/common";
import { SettlementsController } from "./settlements.controller";
import { SettlementsService } from "./settlements.service";
import { SettlementsProvider } from "./settlements.provider";
import { ProductsModule } from "../PRODUCTS/products.module";

@Module({
  imports: [ProductsModule],
  controllers: [SettlementsController],
  providers: [SettlementsService, ...SettlementsProvider],
  exports: [SettlementsService, ...SettlementsProvider],
})
export class SettlementsModule {}
