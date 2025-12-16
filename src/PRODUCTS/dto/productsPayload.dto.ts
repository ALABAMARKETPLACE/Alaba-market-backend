import { ApiProperty } from "@nestjs/swagger";
import { CreateProductsDto } from "./create.dto";
import { CreateProductImageDto } from "../../PRODUCT_IMAGE/dto/createProductImage.dto";
import { CreateProductVariantDto } from "../../PRODUCT_VARIANTS/dto/createProductVariant.dto";

export class ProductsPayloadDto {
  @ApiProperty()
  readonly information: CreateProductsDto;

  @ApiProperty()
  readonly images: CreateProductImageDto[];

  @ApiProperty()
  readonly variants: CreateProductVariantDto[];

  @ApiProperty()
  readonly coverImage: CreateProductImageDto;

  @ApiProperty()
  readonly product_video?: string;
}
