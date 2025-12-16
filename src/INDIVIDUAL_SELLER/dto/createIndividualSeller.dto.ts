import { ApiProperty } from "@nestjs/swagger";

export class CreateIndividualSellerDto {
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
}
