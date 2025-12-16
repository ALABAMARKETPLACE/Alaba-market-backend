import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional } from "class-validator";
import { PageOptionsDto } from "../../shared/dto/pageOptions.dto";

export class StoreSearchPaginationDto extends PageOptionsDto {
  @ApiPropertyOptional()
  @IsOptional()
  readonly name?: string;
}
