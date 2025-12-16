import { ApiProperty } from "@nestjs/swagger";
import { Address } from "../address.entity";

export class AddressDto {
  @ApiProperty()
  readonly id: number;

  @ApiProperty()
  readonly userId: number;

  @ApiProperty()
  readonly flat: string;

  @ApiProperty()
  readonly fullAddress: string;

  @ApiProperty()
  readonly pin_code: string;

  @ApiProperty()
  readonly state: string;

  @ApiProperty()
  readonly city: string;

  @ApiProperty()
  readonly country: string;

  @ApiProperty()
  readonly street: string;

  @ApiProperty()
  readonly alt_phone: string;

  @ApiProperty()
  readonly code: string;

  @ApiProperty()
  readonly type: string;

  @ApiProperty()
  readonly lat: number;

  @ApiProperty()
  readonly long: number;

  @ApiProperty()
  readonly default: boolean;

  constructor(address: Address) {
    this.id = address.id;
    this.userId = address.userId;
    this.flat = address.flat;
    this.pin_code = address.pin_code;
    this.state = address.state;
    this.country = address.country;
    this.street = address.street;
    this.alt_phone = address.alt_phone;
    this.type = address.type;
    this.city = address.city;
    this.fullAddress = address.fullAddress;
    this.code = address.code;
    this.lat = address.lat;
    this.long = address.long;
    this.default = address.default;
  }
}
