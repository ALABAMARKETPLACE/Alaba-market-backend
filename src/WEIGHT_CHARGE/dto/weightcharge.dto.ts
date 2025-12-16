import { ApiProperty } from "@nestjs/swagger";
import { WeightCharge } from "../weightcharge.entity";

export class WeightChargeDto {
  @ApiProperty()
  readonly id: number;
  
  @ApiProperty()
  readonly weight: string;

  @ApiProperty()
  readonly operator: string;

  @ApiProperty()
  readonly charge: string;

  constructor(weightCharge: WeightCharge) {
    this.id = weightCharge.id;
    this.weight = weightCharge.weight;
    this.operator = weightCharge.operator;
    this.charge = weightCharge.charge;
  }
}