import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsNotEmpty, IsOptional } from "class-validator";

export class OrderStatisticsDto {
  @ApiProperty()
  @IsOptional()
  @IsDateString()
  readonly date: Date;
}
