import { ApiProperty } from "@nestjs/swagger";
import { Settings } from "../settings.entity";

export class SettingsDto {
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

  constructor(settings: Settings) {
    this.type = settings.type;
    this.isLocation = settings.isLocation;
    this.currency = settings.currency;
    this.adminEmail = settings.adminEmail;
    this.supportInfoEmail = settings.supportInfoEmail;
    this.contactEmail = settings.contactEmail;
    this.contactNumber = settings.contactNumber;
    this.address = settings.address;
    this.radius = settings.radius;
  }
}
