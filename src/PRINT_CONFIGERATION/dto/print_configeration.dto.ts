import { ApiProperty } from "@nestjs/swagger";
import { PrintConfigeration } from "../print_configeration.entity";

export class PrintConfigerationDto {
  @ApiProperty()
  readonly id: number;

  @ApiProperty()
  readonly doublesided: boolean;

  @ApiProperty()
  readonly amount: number;

  @ApiProperty()
  readonly printType: string;
  @ApiProperty()
  readonly printColor: string;

  constructor(PrintConfigeration: PrintConfigeration) {
    this.id = PrintConfigeration.id;
    this.amount = PrintConfigeration.amount;
    this.printColor = PrintConfigeration.printColor;
    this.doublesided = PrintConfigeration.doublesided;
  }
}

export class PrintPriceDto {
  @ApiProperty()
  readonly printColor: string;
  @ApiProperty()
  readonly printType: string;
  @ApiProperty()
  readonly doublesided: string;
}