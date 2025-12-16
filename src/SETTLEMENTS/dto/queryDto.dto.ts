import { ApiPropertyOptional } from "@nestjs/swagger";
import { PageOptionsDto } from "../../shared/dto/pageOptions.dto";
import { IsIn, IsOptional } from "class-validator";

export class SettlementsQueryDto extends PageOptionsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(["pending", "requested", "success", ""])
  settle_status: string;
}
