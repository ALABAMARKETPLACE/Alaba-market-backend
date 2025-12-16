import { ApiProperty } from "@nestjs/swagger";

export class CreateOrderDto {
  @ApiProperty()
  readonly userId: number;

  @ApiProperty()
  readonly addressId: number;

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
  readonly status: string;
}
