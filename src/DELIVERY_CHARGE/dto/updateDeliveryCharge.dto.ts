import { ApiProperty } from "@nestjs/swagger";
import { IsOptional } from "class-validator";

export class UpdateDeliveryChargeDto {
  @ApiProperty()
  readonly id: number;

  @ApiProperty()
  @IsOptional()
  readonly comparisonOperator: string;

  @ApiProperty()
  @IsOptional()
  readonly amount: number;

  @ApiProperty()
  @IsOptional()
  readonly charge: number;
}
