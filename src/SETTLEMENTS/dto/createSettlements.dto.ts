import { ApiProperty } from "@nestjs/swagger";
import { IsOptional } from "class-validator";

export class CreateSettlementsDto {
  @ApiProperty()
  readonly storeId: number;

  @ApiProperty()
  readonly paid: number;

  @ApiProperty()
  readonly payment_type: string;

  @ApiProperty()
  @IsOptional()
  readonly status: string;

  @ApiProperty()
  @IsOptional()
  readonly remark: string;

  @ApiProperty()
  @IsOptional()
  readonly user_bank_id: number;
}
