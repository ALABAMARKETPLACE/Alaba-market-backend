import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export enum StoreSortOption {
  RANDOM = 'random',
  NEWEST = 'newest',
  NAME_ASC = 'name_asc',
  NAME_DESC = 'name_desc',
}

export class GetMarketplaceStoresDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  take?: number = 20;

  @ApiPropertyOptional({ description: 'Search stores by name, business name, slug, or address' })
  @IsString()
  @IsOptional()
  q?: string;

  @ApiPropertyOptional({ enum: StoreSortOption, default: StoreSortOption.RANDOM })
  @IsEnum(StoreSortOption)
  @IsOptional()
  sort?: StoreSortOption = StoreSortOption.RANDOM;

  @ApiPropertyOptional({
    description: 'Include SEO fields on each store item',
    default: false,
  })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  includeSeo?: boolean = false;

  @ApiPropertyOptional({
    description: 'Include page-level SEO metadata in the response wrapper',
    default: false,
  })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  includeMeta?: boolean = false;
}
