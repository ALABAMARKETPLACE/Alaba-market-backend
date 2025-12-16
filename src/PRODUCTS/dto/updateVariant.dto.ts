import { ApiProperty } from "@nestjs/swagger";
import { IsOptional } from "class-validator";

export class UpdateProductVariantDto {

  @ApiProperty()
  @IsOptional()
  readonly barcode?: string;

  @ApiProperty()
  @IsOptional()
  readonly image?: string;

  @ApiProperty()
  @IsOptional()
  readonly price?: number;

  @ApiProperty()
  @IsOptional()
  readonly sku?: string;

  @ApiProperty()
  @IsOptional()
  readonly units?: number;

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
