import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsUrl } from "class-validator";

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
}
