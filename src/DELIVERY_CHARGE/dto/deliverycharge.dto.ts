import { ApiProperty } from "@nestjs/swagger";
import { DeliveryCharge } from "../deliverycharge.entity";

export class DeliveryChargeDto {
  @ApiProperty()
  readonly id: number;

  @ApiProperty()
  readonly comparisonOperator: string;

  @ApiProperty()
  readonly amount: number;

  @ApiProperty()
  readonly charge: number;

  constructor(deliveryCharge: DeliveryCharge) {
    this.id = deliveryCharge.id;
    this.comparisonOperator = deliveryCharge.comparisonOperator;
    this.amount = deliveryCharge.amount;
    this.charge = deliveryCharge.charge;
  }
}
