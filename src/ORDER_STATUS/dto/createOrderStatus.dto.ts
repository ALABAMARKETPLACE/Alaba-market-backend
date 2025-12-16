import { ApiProperty } from "@nestjs/swagger";

export class CreateOrderStatusDto {
  @ApiProperty()
  readonly orderId: number;

  @ApiProperty()
  readonly status: string;

  @ApiProperty()
  readonly remark: string;
}
