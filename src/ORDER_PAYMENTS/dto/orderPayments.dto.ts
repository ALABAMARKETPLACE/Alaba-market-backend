import { ApiProperty } from "@nestjs/swagger";
import { OrderPayments } from "../order_payments.entity";
export class OrderPaymentsDto {
  @ApiProperty()
  readonly id: number;

  @ApiProperty()
  readonly orderId: number;

  @ApiProperty()
  readonly paymentType: string;

  @ApiProperty()
  readonly status: string;

  constructor(order_payments: OrderPayments) {
    this.id = order_payments.id;
    this.paymentType = order_payments.paymentType;
    this.status = order_payments.status;
  }
}
