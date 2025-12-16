import { ApiProperty } from "@nestjs/swagger";
export class CreateOrderPaymentsDto {
  @ApiProperty()
  readonly orderId: number;
}
