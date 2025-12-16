import { ApiProperty } from "@nestjs/swagger";

export class DeactivateAccountDto {
  @ApiProperty()
  readonly token: string;
}
