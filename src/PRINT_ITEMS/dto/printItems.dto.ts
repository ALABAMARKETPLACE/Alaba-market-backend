import { ApiProperty } from "@nestjs/swagger";
import { PrintItems } from "../print_items.entity";
export class PrintItemsDto {
  @ApiProperty()
  readonly id: number;

  @ApiProperty()
  readonly orderId: number;

  @ApiProperty()
  readonly quantity: number;

  @ApiProperty()
  readonly price: number;

  @ApiProperty()
  readonly totalPrice: number;

  @ApiProperty()
  readonly image: string;

  @ApiProperty()
  readonly name: string;

  constructor(order_items: PrintItems) {
    this.id = order_items.id;
    this.orderId = order_items.printId;
    this.quantity = order_items.quantity;
    this.price = order_items.price;
    this.totalPrice = order_items.totalPrice;
    this.image = order_items.image;
    this.name = order_items.name;
  }
}
