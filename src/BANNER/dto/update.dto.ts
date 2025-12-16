import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsUrl, MaxLength } from "class-validator";

export class UpdateBannerDto {
  @ApiProperty()
  @IsOptional()
  @MaxLength(100)
  readonly description: string;

  @ApiProperty()
  @IsUrl()
  @IsOptional()
  readonly img_desk: string;

  @ApiProperty()
  @IsOptional()
  readonly img_mob: string;

  @ApiProperty()
  @MaxLength(50)
  @IsOptional()
  readonly title: string;

  @ApiProperty()
  @IsOptional()
  readonly status: boolean;
}
