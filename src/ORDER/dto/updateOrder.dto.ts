import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsDateString } from "class-validator";

export class UpdateOrderDto {
  @ApiProperty()
  @IsOptional()
  readonly addressId: number;

  @ApiProperty()
  @IsOptional()
  readonly status: string;

  @ApiProperty({ required: false, type: String, format: "date-time" })
  @IsOptional()
  @IsDateString()
  readonly delivery_date?: string;
}
