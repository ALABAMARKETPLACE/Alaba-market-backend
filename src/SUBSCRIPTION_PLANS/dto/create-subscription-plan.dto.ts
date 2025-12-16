import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  Min,
  MinLength,
} from "class-validator";

export class CreateSubscriptionPlanDto {
  @ApiProperty({ example: "Bronze" })
  @IsString()
  @MinLength(1, { message: "Plan name is required" })
  readonly name: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(1, { message: "Minimum products must be at least 1" })
  readonly min_products: number;

  @ApiProperty({ example: 5 })
  @IsNumber()
  @Min(1, { message: "Maximum products must be at least 1" })
  readonly max_products: number;

  @ApiProperty({ example: 30, description: "Subscription duration in days (e.g., 15, 30, 90)" })
  @IsNumber()
  @Min(1, { message: "Duration must be at least 1 day" })
  readonly duration_days: number;

  @ApiProperty({ example: 250.0, description: "Price for the subscription duration" })
  @IsNumber()
  @Min(0, { message: "Price cannot be negative" })
  readonly price: number;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  readonly is_active?: boolean;

  @ApiProperty({ 
    example: 0, 
    required: false,
    description: "Featured position on homepage (0=not featured, 1-4=position)"
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  readonly featured_position?: number;
}
