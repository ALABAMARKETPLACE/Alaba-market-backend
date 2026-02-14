import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsOptional, IsUrl } from "class-validator";

export class CreateBannerDto {
  @ApiProperty()
  @IsOptional()
  readonly description: string;

  @ApiProperty()
  @IsUrl()
  @IsNotEmpty()
  readonly img_desk: string;

  @ApiProperty()
  @IsOptional()
  readonly img_mob: string;

  @ApiProperty()
  @IsOptional()
  readonly title: string;

  // ✅ Add storeId as optional - admins can specify, sellers will use JWT token
  @ApiPropertyOptional({
    description: "Store ID (optional for admins, ignored for sellers)",
    example: 123,
  })
  @IsInt()
  @IsOptional()
  readonly storeId?: number;
}
