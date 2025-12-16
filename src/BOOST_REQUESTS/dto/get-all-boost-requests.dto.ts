import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsOptional, IsIn, IsInt, IsString } from "class-validator";

export class GetAllBoostRequestsDto {
  @ApiPropertyOptional({
    description: "Page number",
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  readonly page?: number = 1;

  @ApiPropertyOptional({
    description: "Number of items per page",
    example: 10,
    default: 10,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  readonly limit?: number = 10;

  @ApiPropertyOptional({
    description: "Search by seller name or product name",
    example: "John Doe",
  })
  @IsOptional()
  @IsString()
  readonly search?: string;

  @ApiPropertyOptional({
    description: "Filter by status",
    enum: ["pending", "approved", "rejected", "expired", "all"],
    example: "pending",
  })
  @IsOptional()
  @IsIn(["pending", "approved", "rejected", "expired", "all"])
  readonly status?: string;

  @ApiPropertyOptional({
    description: "Seller ID (required for sellers, optional for admin)",
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  readonly seller_id?: number;

  @ApiPropertyOptional({
    description: "Filter by plan ID",
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  readonly plan_id?: number;
}
