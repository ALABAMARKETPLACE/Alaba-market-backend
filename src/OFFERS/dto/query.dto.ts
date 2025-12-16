import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsOptional } from "class-validator";
import { PageOptionsDto } from "../../shared/dto/pageOptions.dto";

export class OffersQueryDto extends PageOptionsDto {
  @ApiPropertyOptional()
  @IsOptional()
  readonly query: string;

  @ApiPropertyOptional()
  @IsOptional()
  readonly status: string;
}
