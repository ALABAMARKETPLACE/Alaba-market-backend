import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayMinSize, ArrayUnique, IsArray, IsInt } from "class-validator";

export class UpdateBoostedProductsDto {
  @ApiProperty({
    description: "Replacement product IDs for the active basic/gold booster.",
    example: [4, 5, 6],
    type: [Number],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsInt({ each: true })
  @Type(() => Number)
  product_ids: number[];
}
