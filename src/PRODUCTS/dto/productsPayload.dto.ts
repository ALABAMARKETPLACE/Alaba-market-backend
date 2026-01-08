import { ApiProperty } from "@nestjs/swagger";
import { CreateProductsDto } from "./create.dto";
import { CreateProductImageDto } from "../../PRODUCT_IMAGE/dto/createProductImage.dto";
import { CreateProductVariantDto } from "../../PRODUCT_VARIANTS/dto/createProductVariant.dto";
import { IsOptional, IsArray, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class ProductsPayloadDto {
  @ApiProperty()
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateProductsDto)
  readonly information: CreateProductsDto;

  @ApiProperty()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductImageDto)
  readonly images: CreateProductImageDto[];

  @ApiProperty()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductVariantDto)
  readonly variants: CreateProductVariantDto[];

  @ApiProperty()
  @IsOptional()
  // Accept flexible shapes for coverImage (string url, object with url, or full CreateProductImageDto)
  readonly coverImage: any;

  @ApiProperty()
  @IsOptional()
  readonly product_video?: string;
}
