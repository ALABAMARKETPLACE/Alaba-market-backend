import { ApiProperty } from "@nestjs/swagger";
import { IsOptional } from "class-validator";

export class UpdateProductImageDto2 {
  @ApiProperty()
  @IsOptional()
  readonly url: string;
}
