import { ApiProperty } from "@nestjs/swagger";
import { IsOptional } from "class-validator";

export class UpdateOrderStatus {
  @ApiProperty()
  readonly status: string;

  @ApiProperty()
  @IsOptional()
  readonly remark: string;

  @ApiProperty()
  @IsOptional()
  readonly delivery_date: string;
}
