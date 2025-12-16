import { ApiProperty } from "@nestjs/swagger";
import { SellerInfoDto } from "./seller-info.dto";
import { BoostInfoDto } from "./boost-info.dto";

export class FeaturedProductDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  image: string;

  @ApiProperty({ required: false })
  sku?: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ type: SellerInfoDto })
  seller: SellerInfoDto;

  @ApiProperty({ type: BoostInfoDto })
  boost_info: BoostInfoDto;
}
