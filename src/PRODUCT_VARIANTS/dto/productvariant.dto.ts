import { ApiProperty } from "@nestjs/swagger";
import { ProductVariant } from "../productvariant.entity";

export class ProductVariantDto {
  @ApiProperty()
  readonly id: number;

  @ApiProperty()
  readonly name: string;

  @ApiProperty()
  readonly productId: number;

  @ApiProperty()
  readonly available: number;

  @ApiProperty()
  readonly barcode: string;

  @ApiProperty()
  readonly image: string;

  @ApiProperty()
  readonly price: number;

  @ApiProperty()
  readonly sku: string;

  @ApiProperty()
  readonly units: number;

  @ApiProperty()
  readonly combination: JSON;

  constructor(productvariant: ProductVariant) {
    this.id = productvariant.id;
    this.name = productvariant.name;
    this.productId = productvariant.productId;
    this.available = productvariant.available;
    this.barcode = productvariant.barcode;
    this.image = productvariant.image;
    this.price = productvariant.price;
    this.sku = productvariant.sku;
    this.units = productvariant.units;
    this.combination = productvariant.combination;
  }
}
