import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, Min, Max, MaxLength } from "class-validator";
import { UUID } from "crypto";

export class CreateProductReviewsDto {
  @ApiProperty()
  @IsNotEmpty({ message: "Invalid Product id" })
  readonly product_id: UUID;

  @ApiProperty()
  @IsNotEmpty({ message: "Please provide Your Remark" })
  @MaxLength(200, { message: "Remark is too long" })
  readonly message: string;

  @ApiProperty()
  @Min(0, { message: "Invalid Rating" })
  @Max(5, { message: "Invalid Rating" })
  @IsNotEmpty({ message: "Please provide Your Remark" })
  readonly rating: number;
}
