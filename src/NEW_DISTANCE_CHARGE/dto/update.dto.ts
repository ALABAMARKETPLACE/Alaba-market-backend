import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, Min } from "class-validator";
import { Type } from "class-transformer";

export class UpdateNewDistanceChargeDto {
  @ApiProperty()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  readonly country_id?: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  readonly state_id?: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber({}, { message: "Minimum weight must be a number" })
  @Min(0, { message: "Minimum weight must be greater than or equal to 0" })
  @Type(() => Number)
  readonly min_weight?: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber({}, { message: "Maximum weight must be a number" })
  @Min(0, { message: "Maximum weight must be greater than or equal to 0" })
  @Type(() => Number)
  readonly max_weight?: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber({}, { message: "Delivery charge must be a number" })
  @Min(0, { message: "Delivery charge must be greater than or equal to 0" })
  @Type(() => Number)
  readonly delivery_charge?: number;
}
