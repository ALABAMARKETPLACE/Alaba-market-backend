import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
} from "class-validator";

export class CreateSubstitutionDto {
  @ApiProperty()
  @IsInt()
  @Type(() => Number)
  readonly orderId: number;

  @ApiProperty()
  @IsInt()
  @Type(() => Number)
  readonly orderItemId: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  readonly availableQuantity: number;

  @ApiProperty()
  @IsOptional()
  readonly remark: string;

  @ApiProperty({ type: [Number] })
  @IsArray({ message: "Please Provide a List of products" })
  @ArrayNotEmpty({ message: "Please Provide a List of products" })
  @IsNumber({}, { each: true, message: "Please Provider Products" })
  readonly substitute: number[];
}
