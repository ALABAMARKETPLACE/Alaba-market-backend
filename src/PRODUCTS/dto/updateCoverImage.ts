import { ApiProperty } from "@nestjs/swagger";
import { bool } from "aws-sdk/clients/signer";
import { IsUrl } from "class-validator";

export class UpdateCoverImage {
  @ApiProperty()
  @IsUrl({}, { message: "Invalid Image" })
  readonly image: string;
}
