import { ApiProperty } from "@nestjs/swagger";

export class CreateInvoiceItemsDto {
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
}
