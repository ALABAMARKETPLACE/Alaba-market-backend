import { ApiProperty } from "@nestjs/swagger";

export class CreateProductImageDto {
  @ApiProperty()
  readonly file: any;

  @ApiProperty()
  readonly id: number;

  @ApiProperty()
  readonly type: string;

  @ApiProperty()
  readonly url: image;
}
type image = {
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
export class UpdateProductImageDto {
  @ApiProperty()
  readonly id: number;

  @ApiProperty()
  readonly type: string;

  @ApiProperty()
  readonly url: string;

  @ApiProperty()
  readonly Key: string;
}
