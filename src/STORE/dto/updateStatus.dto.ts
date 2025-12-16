import { ApiProperty } from "@nestjs/swagger";
import { IsOptional } from "class-validator";

export class UpdateStoreStatusDto {
  @ApiProperty()
  @IsOptional()
  readonly status: string;

  @ApiProperty()
  @IsOptional()
  readonly status_remark: string;
}
