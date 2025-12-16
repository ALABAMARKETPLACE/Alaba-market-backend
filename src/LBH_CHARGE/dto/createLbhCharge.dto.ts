import { ApiProperty } from "@nestjs/swagger";

export class CreateLbhChargeDto {
  @ApiProperty()
  readonly length: string;

  @ApiProperty()
  readonly breadth: string;

  @ApiProperty()
  readonly height: string;

  @ApiProperty()
  readonly operator: string;

  @ApiProperty()
  readonly charge: string;
}