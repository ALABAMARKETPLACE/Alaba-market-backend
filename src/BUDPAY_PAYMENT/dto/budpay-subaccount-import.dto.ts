import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsBoolean, IsInt, IsOptional, Min } from "class-validator";

const toBoolean = ({ value }: { value: unknown }) =>
  value === true || ["true", "1", "yes"].includes(String(value).toLowerCase());

export class BudPaySubaccountImportDto {
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  dryRun?: boolean;

  @ApiPropertyOptional({ default: 100, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  storeId?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  retryFailed?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  force?: boolean;
}

export class BudPayImportStatusQueryDto {
  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  storeId?: number;

  @ApiPropertyOptional({ default: 100, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
