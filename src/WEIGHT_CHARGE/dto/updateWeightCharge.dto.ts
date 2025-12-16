import { ApiProperty } from "@nestjs/swagger";
import { IsOptional } from "class-validator";

export class UpdateWeightChargeDto {
  @ApiProperty()
  readonly id: number;

  @ApiProperty()
  @IsOptional()
  readonly weight: string;
  
  @ApiProperty()
  @IsOptional()
  readonly operator: string;

  @ApiProperty()
  @IsOptional()
  readonly charge: string;
}
