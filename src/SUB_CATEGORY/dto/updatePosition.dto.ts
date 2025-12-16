import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, Max, Min } from "class-validator";

export class UpdateSubcategoryPositionDto {
  @ApiProperty()
  @Min(0)
  @Max(1000)
  @IsInt()
  @Type(() => Number)
  readonly position: number;
}
