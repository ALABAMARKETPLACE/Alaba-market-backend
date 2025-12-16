import { ApiProperty } from "@nestjs/swagger";
import { bool } from "aws-sdk/clients/signer";

export class UpdateProductImagesAddFiles {
  @ApiProperty()
  readonly file: any;

  @ApiProperty()
  readonly id: number;

  @ApiProperty()
  readonly type: string;

  @ApiProperty()
  readonly url: image;
}
export class UpdateProductImagesRemoveFiles {
  @ApiProperty()
  readonly id: number;

  @ApiProperty()
  readonly type: string;

  @ApiProperty()
  readonly url: string;

  @ApiProperty()
  readonly Key: string;

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

export class UpdateProductImagePayloadDto {
  @ApiProperty()
  readonly addImages: UpdateProductImagesAddFiles[];

  @ApiProperty()
  readonly removeImages: UpdateProductImagesRemoveFiles[];
}
