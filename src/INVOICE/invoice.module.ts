import { Module } from '@nestjs/common';
import { InvoiceController } from './invoice.controller';
import { InvoiceService } from './invoice.service';
import { InvoiceProvider } from './invoice.provider';
import { EmailModule } from '../MAILS/Mails.module';
import { InvoiceItemsModule } from '../INVOICE_ITEMS/invoiceitems.module';


@Module({
  imports: [EmailModule,InvoiceItemsModule],
  controllers: [InvoiceController],
  providers: [ InvoiceService,...InvoiceProvider],
  exports: [InvoiceService],
})
export class InvoiceModule {}
