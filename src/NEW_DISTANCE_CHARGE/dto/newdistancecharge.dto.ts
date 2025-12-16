import { ApiProperty } from "@nestjs/swagger";
import { NewDistanceCharge } from "../newdistancecharge.entity";

export class NewDistanceChargeDto {
  @ApiProperty()
  readonly id: number;

  @ApiProperty()
  readonly country_id: number;

  @ApiProperty()
  readonly state_id: number;

  @ApiProperty()
  readonly min_weight: number;

  @ApiProperty()
  readonly max_weight: number;

  @ApiProperty()
  readonly delivery_charge: number;

  @ApiProperty()
  readonly createdAt: Date;

  @ApiProperty()
  readonly updatedAt: Date;

  @ApiProperty()
  readonly countryDetails?: any;

  @ApiProperty()
  readonly stateDetails?: any;

  constructor(data: NewDistanceCharge) {
    this.id = data.id;
    this.country_id = data.country_id;
    this.state_id = data.state_id;
    this.min_weight = data.min_weight;
    this.max_weight = data.max_weight;
    this.delivery_charge = data.delivery_charge;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.countryDetails = data.countryDetails;
    this.stateDetails = data.stateDetails;
  }
}
