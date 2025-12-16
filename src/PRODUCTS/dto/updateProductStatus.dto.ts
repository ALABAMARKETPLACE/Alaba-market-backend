import { ApiProperty } from "@nestjs/swagger";
import { bool } from "aws-sdk/clients/signer";

export class UpdateProductStatusDto {
  @ApiProperty()
  readonly status: boolean;
}
