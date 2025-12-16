import { ApiProperty } from "@nestjs/swagger";

export class VerifyMailDto {
  @ApiProperty()
  readonly userId: number;
}
