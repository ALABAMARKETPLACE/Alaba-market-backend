import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  Min,
  MinLength,
} from "class-validator";

export class UpdateSubscriptionPlanDto {
  @ApiProperty()
  readonly id: number;

  @ApiProperty({ required: false })
  @IsString()
  @MinLength(1, { message: "Plan name is required" })
  @IsOptional()
  readonly name?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @Min(1, { message: "Minimum products must be at least 1" })
  @IsOptional()
  readonly min_products?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @Min(1, { message: "Maximum products must be at least 1" })
  @IsOptional()
  readonly max_products?: number;

  @ApiProperty({ required: false, description: "Subscription duration in days" })
  @IsNumber()
  @Min(1, { message: "Duration must be at least 1 day" })
  @IsOptional()
  readonly duration_days?: number;

  @ApiProperty({ required: false, description: "Price for the subscription duration" })
  @IsNumber()
  @Min(0, { message: "Price cannot be negative" })
  @IsOptional()
  readonly price?: number;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  readonly is_active?: boolean;

  @ApiProperty({ 
    required: false,
    description: "Featured position on homepage (0=not featured, 1-4=position)"
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  readonly featured_position?: number;
}
