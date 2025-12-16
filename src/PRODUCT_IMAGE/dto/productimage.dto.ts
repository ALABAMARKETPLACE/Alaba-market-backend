import { ApiProperty } from "@nestjs/swagger";
import { ProductImage } from "../productimage.entity";

export class ProductImageDto {
  @ApiProperty()
  readonly id: number;

  @ApiProperty()
  readonly url: string;

  @ApiProperty()
  readonly productId: number;

  @ApiProperty()
  readonly type: string;

  @ApiProperty()
  readonly Key: string;

  constructor(productimage: ProductImage) {
    this.id = productimage.id;
    this.url = productimage.url;
    this.productId = productimage.productId;
    this.type = productimage.type;
    this.Key=productimage.Key;
  }
}
