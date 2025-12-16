import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString } from "class-validator";
import { PageOptionsDto } from "../../shared/dto/pageOptions.dto";
import { Type } from "class-transformer";

export class PageOptionsDtoSubcategory extends PageOptionsDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  readonly search?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  readonly category?: number;
}
