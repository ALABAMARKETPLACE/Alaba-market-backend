import { ApiProperty } from "@nestjs/swagger";

export class CaluclateDeliveryChargeDto {
  @ApiProperty()
  readonly amount: number;
}
