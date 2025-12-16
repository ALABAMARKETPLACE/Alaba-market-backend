import { ApiProperty } from "@nestjs/swagger";
import { Print } from "../print.entity";

export class PrintDto {
  @ApiProperty()
  readonly id: number;

  @ApiProperty()
  readonly userId: number;

  @ApiProperty()
  readonly addressId: number;

  @ApiProperty()
  readonly storeId: number;

  @ApiProperty()
  readonly totalItems: number;

  @ApiProperty()
  readonly paymentType: string;

  @ApiProperty()
  readonly coupan: string;

  @ApiProperty()
  readonly tax: number;

  @ApiProperty()
  readonly deliveryCharge: number;

  @ApiProperty()
  readonly discount: number;

  @ApiProperty()
  readonly total: number;

  @ApiProperty()
  readonly grandTotal: number;

  @ApiProperty()
  readonly status: string;

  @ApiProperty()
  readonly print_id: number;

  constructor(products: Print) {
    this.id = products.id;
    this.userId = products.userId;
    this.addressId = products.addressId;
    this.storeId = products.storeId;
    this.totalItems = products.totalItems;
    this.paymentType = products.paymentType;
    this.coupan = products.coupan;
    this.tax = products.tax;
    this.deliveryCharge = products.deliveryCharge;
    this.discount = products.discount;
    this.total = products.total;
    this.grandTotal = products.grandTotal;
    this.status = products.status;
    this.print_id = products.print_id;
  }
}
