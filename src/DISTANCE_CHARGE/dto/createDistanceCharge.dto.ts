import { ApiProperty } from "@nestjs/swagger";

export class CreateDistanceChargeDto {
  @ApiProperty()
  readonly distance: number;

  @ApiProperty()
  readonly operator: string;

  @ApiProperty()
  readonly charge: number;
}