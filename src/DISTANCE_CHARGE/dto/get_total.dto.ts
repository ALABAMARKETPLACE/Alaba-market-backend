import { ApiProperty } from "@nestjs/swagger";

export class GetTotalChargeDto {
  @ApiProperty()
  readonly distance: number;
}