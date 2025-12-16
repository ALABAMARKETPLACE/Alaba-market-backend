import { ApiProperty } from "@nestjs/swagger";
import { IsOptional } from "class-validator";

export class UpdateIndividualSellerDto {
  @ApiProperty()
  @IsOptional()
  readonly name: string;

  @ApiProperty()
  @IsOptional()
  readonly email: string;

  @ApiProperty()
  @IsOptional()
  readonly phone: string;

  @ApiProperty()
  @IsOptional()
  readonly business_location: string;

  @ApiProperty()
  @IsOptional()
  readonly education: string;

  @ApiProperty()
  @IsOptional()
  readonly visa_status: string;

  @ApiProperty()
  @IsOptional()
  readonly age: number;

  @ApiProperty()
  @IsOptional()
  readonly gender: string;

  @ApiProperty()
  @IsOptional()
  readonly language: string;

  @ApiProperty()
  @IsOptional()
  readonly interest: string;
}
