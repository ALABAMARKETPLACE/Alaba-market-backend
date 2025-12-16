import { ApiProperty } from "@nestjs/swagger";

export class VerifyUserTokenDto {
    @ApiProperty()
    readonly token: string;
  }