import { Module } from "@nestjs/common";
import { PrintItemsService } from "./print_items.service";
import { PrintItemsProvider } from "./print_items.provider";

@Module({
  imports: [],
  controllers: [],
  providers: [PrintItemsService, ...PrintItemsProvider],
  exports: [PrintItemsService],
})
export class PrintItemsModule {}
