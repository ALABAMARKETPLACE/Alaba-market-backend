import { ApiProperty } from "@nestjs/swagger";
import { Countries } from "../countries.entity";

export class CountriesDto {
  @ApiProperty()
  readonly id: number;

  @ApiProperty()
  readonly country_name: string;

  @ApiProperty()
  readonly description: string;

  @ApiProperty()
  readonly createdAt: Date;

  @ApiProperty()
  readonly updatedAt: Date;

  constructor(countries: Countries) {
    this.id = countries.id;
    this.country_name = countries.country_name;
    this.description = countries.description;
    this.createdAt = countries.createdAt;
    this.updatedAt = countries.updatedAt;
  }
}
