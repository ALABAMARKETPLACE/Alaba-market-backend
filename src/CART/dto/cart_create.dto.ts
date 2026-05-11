import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsOptional } from "class-validator";
export class CreateCartDto {
  @ApiProperty()
  @IsNotEmpty()
  readonly productId: string | number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  readonly variantId: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  readonly quantity: number;
}
