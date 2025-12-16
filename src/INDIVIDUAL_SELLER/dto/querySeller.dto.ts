import { IsOptional, IsString } from "class-validator";
import { PageOptionsDto } from "../../shared/dto/pageOptions.dto";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class QuerySellerDto extends PageOptionsDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  readonly query?: string;
}
