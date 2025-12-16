import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, Max, Min } from "class-validator";
import { Order } from "../../shared/constants/constants";
import { PageOptionsDto } from "../../shared/dto/pageOptions.dto";

export class PageOptionsForUsersAll extends PageOptionsDto {
  @ApiPropertyOptional()
  @IsOptional()
  readonly name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => {
    if (value == "active") return true;
    if (value == "inactive") return false;
    return null;
  })
  readonly status?: boolean;
}
