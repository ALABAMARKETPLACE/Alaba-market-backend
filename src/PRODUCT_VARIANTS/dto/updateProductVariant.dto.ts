import { ApiProperty } from "@nestjs/swagger";
import { IsOptional } from "class-validator";

export class UpdateProductVariantDto {
  @ApiProperty()
  @IsOptional()
  readonly name: string;

  @ApiProperty()
  @IsOptional()
  readonly productId: number;

  @ApiProperty()
  @IsOptional()
  readonly available: number;

  @ApiProperty()
  @IsOptional()
  readonly barcode: string;

  @ApiProperty()
  @IsOptional()
  readonly image: string;

  @ApiProperty()
  @IsOptional()
  readonly price: number;

  @ApiProperty()
  @IsOptional()
  readonly sku: string;

  @ApiProperty()
  @IsOptional()
  readonly units: number;

  @ApiProperty()
  @IsOptional()
  readonly combination: JSON;
}
