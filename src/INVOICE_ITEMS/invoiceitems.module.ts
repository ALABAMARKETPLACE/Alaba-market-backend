import { Module } from "@nestjs/common";
import { InvoiceItemsController } from "./invoiceitems.controller";
import { InvoiceItemsService } from "./invoiceitems.service";
import { InvoiceItemsProvider } from "./invoiceitems.provider";
@Module({
  imports: [],
  controllers: [InvoiceItemsController],
  providers: [InvoiceItemsService, ...InvoiceItemsProvider],
  exports: [InvoiceItemsService],
})
export class InvoiceItemsModule {}
