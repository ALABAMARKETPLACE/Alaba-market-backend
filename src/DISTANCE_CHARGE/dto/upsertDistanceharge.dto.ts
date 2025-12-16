import { ApiProperty } from "@nestjs/swagger";
import {
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class DistanceChargeItemsDto {
  @ApiProperty()
  @IsOptional()
  readonly id: number;

  @ApiProperty()
  @IsOptional()
  @IsIn(["=", "<=", ">=", ">", "<"], {
    message: "Invalid Comparison Operator",
  })
  readonly operator: string;

  @ApiProperty()
  @IsNumber()
  @Min(1, { message: "Amount Cannot be Less Than Zero" })
  @IsOptional()
  readonly distance: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  @Min(0, { message: "Amount Cannot be Less Than Zero" })
  readonly charge: number;
}

export class UpsertDistanceChargeDto {
  @ApiProperty({
    type: [DistanceChargeItemsDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DistanceChargeItemsDto)
  distanceChargeItems: DistanceChargeItemsDto[];
}
