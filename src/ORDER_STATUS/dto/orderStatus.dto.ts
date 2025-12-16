import { ApiProperty } from "@nestjs/swagger";
import { OrderStatus } from "../order_status.entity";

export class OrderStatusDto {
  @ApiProperty()
  readonly id: number;

  @ApiProperty()
  readonly orderId: number;

  @ApiProperty()
  readonly status: string;

  @ApiProperty()
  readonly remark: string;

  constructor(order_status: OrderStatus) {
    this.id = order_status.id;
    this.orderId = order_status.orderId;
    this.status = order_status.status;
    this.remark = order_status.remark;
  }
}
