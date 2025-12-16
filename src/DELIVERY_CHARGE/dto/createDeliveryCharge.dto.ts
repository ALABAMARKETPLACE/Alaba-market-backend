import { ApiProperty } from "@nestjs/swagger";

export class CreateDeliveryChargeDto {

  @ApiProperty()
  readonly comparisonOperator: string;

  @ApiProperty()
  readonly amount: number;

  @ApiProperty()
  readonly charge: number;
}
