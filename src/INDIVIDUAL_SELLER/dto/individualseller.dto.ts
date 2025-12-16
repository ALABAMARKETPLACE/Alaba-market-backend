import { ApiProperty } from "@nestjs/swagger";
import { IndividualSeller } from "../individualseller.entity";

export class IndividualSellerDto {
  @ApiProperty()
  readonly name: string;

  @ApiProperty()
  readonly email: string;

  @ApiProperty()
  readonly phone: string;

  @ApiProperty()
  readonly code: string;

  @ApiProperty()
  readonly business_location: string;

  @ApiProperty()
  readonly education: string;

  @ApiProperty()
  readonly visa_status: string;

  @ApiProperty()
  readonly age: number;

  @ApiProperty()
  readonly gender: string;

  @ApiProperty()
  readonly language: string;

  @ApiProperty()
  readonly interest: string;

  @ApiProperty()
  readonly id: number;

  @ApiProperty()
  readonly status: string;

  constructor(individualseller: IndividualSeller) {
    this.name = individualseller.name;
    this.email = individualseller.email;
    this.business_location = individualseller.business_location;
    this.education = individualseller.education;
    this.visa_status = individualseller.visa_status;
    this.age = individualseller.age;
    this.gender = individualseller.gender;
    this.language = individualseller.language;
    this.interest = individualseller.interest;
    this.id = individualseller.id;
    this.phone=individualseller.phone;
    this.code=individualseller.code;
    this.status=individualseller.status;
  }
}
