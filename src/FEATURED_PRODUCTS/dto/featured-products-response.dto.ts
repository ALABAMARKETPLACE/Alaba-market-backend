import { ApiProperty } from "@nestjs/swagger";
import { FeaturedProductDto } from "./featured-product.dto";
import { RotationInfoDto } from "./rotation-info.dto";

export class FeaturedProductsResponseDto {
  @ApiProperty({ description: "Featured position number (1-4)" })
  position: number;

  @ApiProperty({ description: "Plan name for this position" })
  plan_name: string;

  @ApiProperty({ type: [FeaturedProductDto], description: "Array of featured products" })
  products: FeaturedProductDto[];

  @ApiProperty({ type: RotationInfoDto, description: "Rotation metadata" })
  rotation_info: RotationInfoDto;
}

