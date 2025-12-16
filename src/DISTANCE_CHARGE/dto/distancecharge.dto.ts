import { ApiProperty } from "@nestjs/swagger";
import { DistanceCharge } from "../distancecharge.entity";

export class DistanceChargeDto {
  @ApiProperty()
  readonly id: number;
  
  @ApiProperty()
  readonly distance: number;

  @ApiProperty()
  readonly operator: string;

  @ApiProperty()
  readonly charge: number;

  constructor(distanceCharge: DistanceCharge) {
    this.id = distanceCharge.id;
    this.distance = distanceCharge.distance;
    this.operator = distanceCharge.operator;
    this.charge = distanceCharge.charge;
  }
}