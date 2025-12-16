import { ApiProperty } from "@nestjs/swagger";
import { InvoiceItems } from "../invoiceitems.entity";

export class InvoiceItemsDto {
  @ApiProperty()
  readonly id: number;

  @ApiProperty()
  readonly product: string;

  @ApiProperty()
  readonly title: string;

  @ApiProperty()
  readonly quantity: number;

  @ApiProperty()
  readonly unitPrice: number;

  @ApiProperty()
  readonly delivery_charge: number;

  @ApiProperty()
  readonly discount: number;

  @ApiProperty()
  readonly tax: number;

  @ApiProperty()
  readonly total: number;

  @ApiProperty()
  readonly invoiceId: string;

  constructor(invoiceitems: InvoiceItems) {
    this.id = invoiceitems.id;
    this.product = invoiceitems.product;
    this.title = invoiceitems.title;
    this.quantity = invoiceitems.quantity;
    this.unitPrice = invoiceitems.unitPrice;
    this.delivery_charge = invoiceitems.delivery_charge;
    this.discount = invoiceitems.discount;
    this.tax = invoiceitems.tax;
    this.total = invoiceitems.total;
    this.invoiceId = invoiceitems.invoiceId;
  }
}
