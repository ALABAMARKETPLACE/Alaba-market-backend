import { ApiProperty } from "@nestjs/swagger";
import { IsOptional } from "class-validator";

export class UpdatePrintStatsuDto {
  @ApiProperty()
  @IsOptional()
  readonly printId: string;

  @ApiProperty()
  @IsOptional()
  readonly userId: number;

  @ApiProperty()
  @IsOptional()
  readonly status: string;

  @ApiProperty()
  @IsOptional()
  readonly remark: string;
}
