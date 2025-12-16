import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, MaxLength } from "class-validator";

export class CreateCategoryDto {
  @ApiProperty()
  @IsNotEmpty()
  @MaxLength(50)
  readonly name: string;

  @ApiProperty()
  readonly image: string;

  @ApiProperty()
  @MaxLength(100)
  readonly description: string;

  @ApiProperty()
  @IsOptional()
  readonly featured?: boolean;

  @ApiProperty()
  @IsOptional()
  readonly featuredTitle?: string;
}
