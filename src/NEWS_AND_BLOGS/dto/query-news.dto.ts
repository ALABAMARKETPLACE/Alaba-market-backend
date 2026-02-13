// NEWS_AND_BLOGS/dto/query-news.dto.ts
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Min } from "class-validator";
import { Order } from "../../shared/constants/constants";

export class QueryNewsDto {
  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 12 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 12;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

  // ✅ Computed properties for PageOptionsDto compatibility
  get take(): number {
    return this.limit || 12;
  }

  get skip(): number {
    return ((this.page || 1) - 1) * (this.limit || 12);
  }

  get offset(): number {
    return this.skip;
  }

  // ✅ Fixed: Use the correct Order enum from constants
  readonly order: Order = Order.DESC;
}
