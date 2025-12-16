import { ApiProperty } from "@nestjs/swagger";

export class CreateProductVariantDto {
  @ApiProperty()
  readonly available: number;

  @ApiProperty()
  readonly barcode: string;

  @ApiProperty()
  readonly image: Image;

  @ApiProperty()
  readonly price: number;

  @ApiProperty()
  readonly sku: string;

  @ApiProperty()
  readonly units: number;

  @ApiProperty()
  readonly combination: JSON;
}
type Image = {
  url: Url;
  file: any;
};
type Url = {
  url: string;
  status: boolean;
  ETag: string;
  ServerSideEncryption: string;
  VersionId: string;
  Location: string;
  key: string;
  Key: string;
  Bucket: string;
};
export type AddNewProductVariantDto = {
  data: CreateProductVariantDto[];
  productId: number;
  name: string;
};
