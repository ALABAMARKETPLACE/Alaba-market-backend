import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { PageOptionsDto } from "../../shared/dto/pageOptions.dto";

export class PageOptionsGetConfiguraitionDto extends PageOptionsDto {
    @ApiPropertyOptional({ default: "" })
      @Type(() => String)
      readonly search: string;
    
      @ApiPropertyOptional({ default: "" })
      @Type(() => String)
      readonly filter: string;
    
}