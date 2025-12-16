import { ApiProperty } from "@nestjs/swagger";
import {
  IsArray,
  IsNumber,
  IsOptional,
  ValidateNested,
  IsObject,
} from "class-validator";
import { Type, Transform } from "class-transformer";

class NewCartItemDto {
  @ApiProperty({ description: "Weight of the item in kg", example: 1 })
  @Type(() => Number)
  @IsNumber()
  weight: number;

  @ApiProperty({
    description: "Quantity of the item",
    example: 4,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  quantity?: number;
}

class NewAddressRefDto {
  @ApiProperty({ required: false, description: "Address ID for validation" })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  id?: number;

  @ApiProperty({ required: false, description: "Country ID" })
  @IsOptional()
  @Transform(({ value }) =>
    value === null || value === "" ? undefined : value
  )
  @Type(() => Number)
  @IsNumber()
  country_id?: number;

  @ApiProperty({ required: false, description: "State ID" })
  @IsOptional()
  @Transform(({ value }) =>
    value === null || value === "" ? undefined : value
  )
  @Type(() => Number)
  @IsNumber()
  state_id?: number;
}

export class NewCalculateDeliveryDto {
  @ApiProperty({ type: [NewCartItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NewCartItemDto)
  cart: NewCartItemDto[];

  @ApiProperty({ type: NewAddressRefDto })
  @IsObject()
  @ValidateNested()
  @Type(() => NewAddressRefDto)
  address: NewAddressRefDto;
}
