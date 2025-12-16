import { ApiProperty } from "@nestjs/swagger";
import { IsInt, Min, Max } from "class-validator";
import { Type } from "class-transformer";

export class UpdateFeaturedPositionDto {
  @ApiProperty({
    description: "Subscription plan ID",
    example: 1,
  })
  @Type(() => Number)
  @IsInt()
  readonly id: number;

  @ApiProperty({
    description: "Featured position (0=not featured, 1-4=position)",
    example: 1,
    minimum: 0,
    maximum: 4,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0, { message: "Position must be between 0 and 4" })
  @Max(4, { message: "Position must be between 0 and 4" })
  readonly featured_position: number;
}
