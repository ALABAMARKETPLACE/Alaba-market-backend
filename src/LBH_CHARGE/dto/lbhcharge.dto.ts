import { ApiProperty } from "@nestjs/swagger";
import { LbhCharge } from "../lbhcharge.entity";

export class LbhChargeDto {
  @ApiProperty()
  readonly id: number;
  
  @ApiProperty()
  readonly length: string;
  
  @ApiProperty()
  readonly breadth: string;
  
  @ApiProperty()
  readonly height: string;

  @ApiProperty()
  readonly operator: string;

  @ApiProperty()
  readonly charge: string;

  constructor(lbhCharge: LbhCharge) {
    this.id = lbhCharge.id;
    this.length = lbhCharge.length;
    this.breadth = lbhCharge.breadth;
    this.height = lbhCharge.height;
    this.operator = lbhCharge.operator;
    this.charge = lbhCharge.charge;
  }
}