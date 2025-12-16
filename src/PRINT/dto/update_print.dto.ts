import { ApiProperty } from "@nestjs/swagger";
import { IsOptional } from "class-validator";

export class UpdatePrintDto {

  @ApiProperty()
  @IsOptional()
  readonly addressId: number;

  @ApiProperty()
  @IsOptional()
  readonly status: string;
}
