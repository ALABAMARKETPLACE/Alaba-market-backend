import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export enum SearchSortOption {
  RANDOM = 'random',
  NEWEST = 'newest',
  PRICE_LOW = 'price_low',
  PRICE_HIGH = 'price_high',
}

export class SearchMarketplaceDto {
  @ApiProperty({ description: 'Search query string' })
  @IsString()
  @IsNotEmpty()
  q: string;

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

  @ApiPropertyOptional({ enum: SearchSortOption, default: SearchSortOption.NEWEST })
  @IsEnum(SearchSortOption)
  @IsOptional()
  sort?: SearchSortOption = SearchSortOption.NEWEST;

  @ApiPropertyOptional({
    description: 'Include SEO fields on each result item',
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
