import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsUrl } from "class-validator";

export class UpdateStoreDto {
  @ApiProperty()
  @IsOptional()
  readonly name: string;

  @ApiProperty()
  @IsOptional()
  readonly email: string;

  @ApiProperty()
  @IsOptional()
  readonly phone: string;

  @ApiProperty()
  @IsOptional()
  readonly code: string;

  @ApiProperty()
  @IsOptional()
  readonly business_location: string;

  @ApiProperty()
  @IsOptional()
  readonly description: string;

  @ApiProperty()
  @IsOptional()
  readonly business_types: JSON;

  @ApiProperty()
  @IsOptional()
  readonly seller_name: string;

  @ApiProperty()
  @IsOptional()
  readonly seller_country: string;

  @ApiProperty()
  @IsOptional()
  readonly id_proof: string;

  @ApiProperty()
  @IsOptional()
  readonly store_name: string;

  @ApiProperty()
  @IsOptional()
  @IsUrl()
  readonly logo_upload: string;

  @ApiProperty()
  @IsOptional()
  readonly business_address: string;

  @ApiProperty()
  @IsOptional()
  @IsUrl()
  readonly cover_image: string;

  @ApiProperty()
  @IsOptional()
  readonly first_name: string;

  @ApiProperty()
  @IsOptional()
  readonly last_name: string;

  @ApiProperty()
  @IsOptional()
  readonly id_type: string;

  @IsOptional()
  @ApiProperty()
  readonly status: string;

  @ApiProperty()
  @IsOptional()
  readonly lat: number;

  @ApiProperty()
  @IsOptional()
  readonly long: number;

  @ApiProperty()
  @IsOptional()
  readonly delivery_period: number;

  @ApiProperty()
  @IsOptional()
  readonly delivery_period_minutes: number;

  @ApiProperty()
  @IsOptional()
  readonly from: string;

  @ApiProperty()
  @IsOptional()
  readonly to: string;

  @ApiProperty()
  @IsOptional()
  readonly auto_approve_refund: boolean;

  @ApiProperty()
  @IsOptional()
  readonly allow_refund: boolean;

  @ApiProperty()
  readonly is_print_available: boolean;
}
