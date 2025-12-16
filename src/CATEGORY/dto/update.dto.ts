import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, MaxLength } from "class-validator";

export class UpdateCategoryDto {
  @ApiProperty()
  @MaxLength(50)
  @IsOptional()
  readonly name: string;

  @ApiProperty()
  @IsOptional()
  readonly image: string;

  @ApiProperty()
  @MaxLength(100)
  @IsOptional()
  readonly description: string;

  @ApiProperty()
  @IsOptional()
  readonly featured?: boolean;

  @ApiProperty()
  @IsOptional()
  readonly featuredTitle?: string;
}
