import { ApiProperty } from "@nestjs/swagger";
import { IsOptional } from "class-validator";

export class UpdateSettlementsDto {
  @ApiProperty()
  @IsOptional()
  readonly storeId: number;

  @ApiProperty()
  @IsOptional()
  readonly total: number;

  @ApiProperty()
  @IsOptional()
  readonly balance: number;

  @ApiProperty()
  @IsOptional()
  readonly paid: number;
}
