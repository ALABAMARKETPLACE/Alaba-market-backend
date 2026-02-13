// banner/dto/update.dto.ts
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsOptional, IsUrl } from "class-validator";

export class UpdateBannerDto {
  @ApiPropertyOptional()
  @IsOptional()
  readonly description?: string;

  @ApiPropertyOptional()
  @IsUrl()
  @IsOptional()
  readonly img_desk?: string;

  @ApiPropertyOptional()
  @IsOptional()
  readonly img_mob?: string;

  @ApiPropertyOptional()
  @IsOptional()
  readonly title?: string;

  // ✅ Add storeId for admin updates
  @ApiPropertyOptional({
    description: "Store ID (optional for admins, ignored for sellers)",
    example: 123,
  })
  @IsInt()
  @IsOptional()
  readonly storeId?: number;
}
