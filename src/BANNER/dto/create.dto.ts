import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsUrl, ValidateIf } from "class-validator";

export class CreateBannerDto {
  @ApiProperty()
  @IsOptional()
  readonly description: string;

  @ApiProperty()
  @ValidateIf((_, value) => value !== undefined && value !== "")
  @IsUrl()
  readonly img_desk?: string;

  @ApiProperty()
  @ValidateIf((_, value) => value !== undefined && value !== "")
  @IsUrl()
  @IsOptional()
  readonly img_mob?: string;

  @ApiProperty()
  @IsOptional()
  readonly title: string;

  // ✅ Add storeId as optional - admins can specify, sellers will use JWT token
  @ApiPropertyOptional({
    description: "Store ID (optional for admins, ignored for sellers)",
    example: 123,
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  readonly storeId?: number;
}
