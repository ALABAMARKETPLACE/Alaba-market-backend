import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsOptional, IsUUID } from "class-validator";
import { UUID } from "crypto";
export class CreateCartDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  readonly productId: UUID;

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
