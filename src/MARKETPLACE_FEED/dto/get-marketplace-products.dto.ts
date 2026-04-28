import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';

export enum FeedSortOption {
  RANDOM = 'random',
  NEWEST = 'newest',
  PRICE_LOW = 'price_low',
  PRICE_HIGH = 'price_high',
}

export class GetMarketplaceProductsDto {
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

  @ApiPropertyOptional({
    minimum: 1,
    maximum: 10,
    default: 3,
    description: 'Max products included per store — prevents one store dominating the feed',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  perStoreLimit?: number = 3;

  @ApiPropertyOptional({ description: 'Filter by category ID' })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  category?: number;

  @ApiPropertyOptional({ description: 'Filter by subCategory ID' })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  subCategory?: number;

  @ApiPropertyOptional({ description: 'Minimum price filter' })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Maximum price filter' })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  maxPrice?: number;

  @ApiPropertyOptional({ enum: FeedSortOption, default: FeedSortOption.RANDOM })
  @IsEnum(FeedSortOption)
  @IsOptional()
  sort?: FeedSortOption = FeedSortOption.RANDOM;

  @ApiPropertyOptional({
    description: 'Include SEO fields (seoTitle, seoDescription, seoKeywords, canonicalPath) on each item',
    default: false,
  })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  includeSeo?: boolean = false;

  @ApiPropertyOptional({
    description: 'Include page-level SEO metadata (title, description, canonicalPath, robots, keywords)',
    default: false,
  })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  includeMeta?: boolean = false;
}
