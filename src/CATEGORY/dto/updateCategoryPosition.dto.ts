import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, Max, Min } from "class-validator";

export class UpdateCategoryPositionDto {
  @ApiProperty()
  @Min(0)
  @Max(1000)
  @IsNotEmpty()
  @IsNumber()
  readonly position: number;
}
