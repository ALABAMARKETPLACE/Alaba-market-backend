import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";
import { PageOptionsDto } from "../../shared/dto/pageOptions.dto";
import { Order } from "../../shared/constants/constants";

export class TopStoreDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  business_type: string;

  @ApiProperty()
  store_name: string;

  @ApiProperty()
  logo_upload: string;

  @ApiProperty()
  business_types: string[];

  @ApiProperty()
  slug: string;

  @ApiProperty()
  default: boolean;

  @ApiProperty()
  sid: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;

  @ApiProperty()
  averageRating: number;

  @ApiProperty()
  ratings: string;
}
