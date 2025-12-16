import { ApiProperty } from "@nestjs/swagger";
import { NewAddress } from "../newaddress.entity";

export class NewAddressDto {
  @ApiProperty()
  readonly id: number;

  @ApiProperty()
  readonly user_id: number;

  @ApiProperty()
  readonly address_type: string;

  @ApiProperty()
  readonly full_address: string;

  @ApiProperty()
  readonly pincode: string;

  @ApiProperty()
  readonly phone_no: string;

  @ApiProperty()
  readonly country_id: number;

  @ApiProperty()
  readonly state_id: number;

  @ApiProperty()
  readonly createdAt: Date;

  @ApiProperty()
  readonly updatedAt: Date;

  @ApiProperty()
  readonly countryDetails?: any;

  @ApiProperty()
  readonly stateDetails?: any;

  constructor(data: NewAddress) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.address_type = data.address_type;
    this.full_address = data.full_address;
    this.pincode = data.pincode;
    this.phone_no = data.phone_no;
    this.country_id = data.country_id;
    this.state_id = data.state_id;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.countryDetails = data.countryDetails;
    this.stateDetails = data.stateDetails;
  }
}
