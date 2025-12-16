import { ApiProperty } from "@nestjs/swagger";

export class CreateSettingsDto {
  @ApiProperty()
  readonly type: string;

  @ApiProperty()
  readonly isLocation: boolean;

  @ApiProperty()
  readonly currency: string;

  @ApiProperty()
  readonly adminEmail: string;

  @ApiProperty()
  readonly supportInfoEmail: string;

  @ApiProperty()
  readonly contactEmail: string;

  @ApiProperty()
  readonly contactNumber: string;

  @ApiProperty()
  readonly address: string;

  @ApiProperty()
  readonly radius: number;
}
