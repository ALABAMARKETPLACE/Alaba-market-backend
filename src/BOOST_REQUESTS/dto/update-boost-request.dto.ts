import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  ArrayMinSize,
} from "class-validator";

export class UpdateBoostRequestDto {
  @ApiProperty({
    description: "Boost request ID",
    example: 1,
  })
  @IsInt()
  @Type(() => Number)
  readonly id: number;

  @ApiProperty({
    description: "Individual Seller ID",
    example: 1,
  })
  @IsInt()
  @Type(() => Number)
  readonly seller_id: number;

  @ApiProperty({
    description: "Subscription plan ID",
    required: false,
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  readonly plan_id?: number;

  @ApiProperty({
    description: "Array of product IDs to boost",
    required: false,
    example: [1, 2, 3],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: "At least one product ID is required" })
  @IsInt({ each: true })
  readonly product_ids?: number[];

  @ApiProperty({
    description: "Optional remarks",
    required: false,
    example: "Updated request details",
  })
  @IsOptional()
  @IsString()
  readonly remarks?: string;
}
