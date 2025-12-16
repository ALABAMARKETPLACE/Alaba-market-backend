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

export class DeliveryChargeItemsDto {
  @ApiProperty()
  @IsOptional()
  readonly id: number;

  @ApiProperty()
  @IsOptional()
  @IsIn(["=", "<=", ">=", ">", "<"], {
    message: "Invalid Comparison Operator",
  })
  readonly comparisonOperator: string;

  @ApiProperty()
  @IsNumber()
  @Min(1, { message: "Amount Cannot be Less Than Zero" })
  @IsOptional()
  readonly amount: number;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  @Min(0, { message: "Amount Cannot be Less Than Zero" })
  readonly charge: number;
}

export class UpsertDeliveryChargeDto {
  @ApiProperty({
    type: [DeliveryChargeItemsDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeliveryChargeItemsDto)
  deliveryChargeItems: DeliveryChargeItemsDto[];
}
