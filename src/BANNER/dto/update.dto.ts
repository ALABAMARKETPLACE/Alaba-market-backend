// banner/dto/update.dto.ts
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsUrl, ValidateIf } from "class-validator";

export class UpdateBannerDto {
  @ApiPropertyOptional()
  @IsOptional()
  readonly description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateIf((_, value) => value !== undefined && value !== "")
  @IsUrl()
  readonly img_desk?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateIf((_, value) => value !== undefined && value !== "")
  @IsUrl()
  readonly img_mob?: string;

  @ApiPropertyOptional()
  @IsOptional()
  readonly title?: string;

  // ✅ Add storeId for admin updates
  @ApiPropertyOptional({
    description: "Store ID (optional for admins, ignored for sellers)",
    example: 123,
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  readonly storeId?: number;
}
