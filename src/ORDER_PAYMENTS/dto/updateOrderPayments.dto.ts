import { ApiProperty } from "@nestjs/swagger";
import { IsOptional } from "class-validator";

export class UpdateOrderPaymentsDto {
  @ApiProperty()
  @IsOptional()
  readonly orderId: string;

  @ApiProperty()
  @IsOptional()
  readonly status: string;
}
