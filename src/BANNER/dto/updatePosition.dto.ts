import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNumber, Max, Min } from "class-validator";

export class UpdateBannerPositionDto {
  @ApiProperty()
  @Min(0)
  @Max(1000)
  @IsInt()
  @IsNumber()
  readonly position: number;
}
