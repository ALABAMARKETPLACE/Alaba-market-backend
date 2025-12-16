import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  ArrayMinSize,
} from "class-validator";

export class CreateBoostRequestDto {
  @ApiProperty({
    description: "Individual Seller ID",
    example: 1,
  })
  @IsInt()
  @Type(() => Number)
  readonly seller_id: number;

  @ApiProperty({
    description: "Subscription plan ID",
    example: 1,
  })
  @IsInt()
  @Type(() => Number)
  readonly plan_id: number;

  @ApiProperty({
    description: "Array of product IDs to boost",
    example: [1, 2, 3],
    type: [Number],
  })
  @IsArray()
  @ArrayMinSize(1, { message: "At least one product ID is required" })
  @IsInt({ each: true })
  readonly product_ids: number[];

  @ApiProperty({
    description: "Optional remarks",
    required: false,
    example: "Please boost these products for the upcoming sale",
  })
  @IsOptional()
  @IsString()
  readonly remarks?: string;
}
