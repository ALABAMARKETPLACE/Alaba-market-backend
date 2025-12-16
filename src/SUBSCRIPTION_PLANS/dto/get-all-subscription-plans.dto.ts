import { ApiProperty } from "@nestjs/swagger";
import {
  IsOptional,
  IsString,
  IsBoolean,
  IsNumber,
  Min,
} from "class-validator";
import { Type } from "class-transformer";

export class GetAllSubscriptionPlansDto {
  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  readonly page?: number;

  @ApiProperty({ required: false, example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  readonly limit?: number;

  @ApiProperty({ required: false, example: "Bronze" })
  @IsOptional()
  @IsString()
  readonly search?: string;

  @ApiProperty({ required: false, example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  readonly is_active?: boolean;
}
