import { ApiProperty } from "@nestjs/swagger";
import { BusinessType } from "../businesstype.entity";

export class BusinessTypeDto {
  @ApiProperty()
  readonly id: number;

  @ApiProperty()
  readonly name: string;

  @ApiProperty()
  readonly description: string;

  constructor(businesstype: BusinessType) {
    this.id = businesstype.id;
    this.name = businesstype.name;
    this.description = businesstype.description;
  }
}
