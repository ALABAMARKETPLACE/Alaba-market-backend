import { ApiProperty } from "@nestjs/swagger";

export class CreateWeightChargeDto {
  @ApiProperty()
  readonly weight: string;

  @ApiProperty()
  readonly operator: string;

  @ApiProperty()
  readonly charge: string;
}