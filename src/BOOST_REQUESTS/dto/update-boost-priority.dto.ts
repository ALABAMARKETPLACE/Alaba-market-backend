import { ApiProperty } from "@nestjs/swagger";
import { IsInt, Min } from "class-validator";
import { Type } from "class-transformer";

export class UpdateBoostPriorityDto {
  @ApiProperty({ description: "Boost request ID", example: 1 })
  @Type(() => Number)
  @IsInt()
  id: number;

  @ApiProperty({ description: "Priority (lower = higher)", example: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  priority: number;
}



