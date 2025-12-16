import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { PageOptionsDto } from "../../shared/dto/pageOptions.dto";

export class PageOptionsGetPrintDto extends PageOptionsDto {
  @ApiPropertyOptional({ default: "" })
  @Type(() => String)
  readonly name: string;

  @ApiPropertyOptional({ default: "" })
  @Type(() => String)
  readonly status: string;

  @ApiPropertyOptional({ default: "" })
  @Type(() => String)
  readonly sort: string;
}
