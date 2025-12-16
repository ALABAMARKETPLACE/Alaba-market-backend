import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { PageOptionsDto } from "../../shared/dto/pageOptions.dto";

export class PageOptionsDtoBanner extends PageOptionsDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  readonly search?: string;
}
