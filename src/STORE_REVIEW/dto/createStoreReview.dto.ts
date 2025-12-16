import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, Max, MaxLength, Min } from "class-validator";

export class CreateStoreReviewDto {
  @ApiProperty()
  @IsNotEmpty()
  readonly orderId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsInt()
  @Max(5)
  @Min(0)
  readonly rating: number;

  @ApiProperty()
  @IsNotEmpty()
  @MaxLength(150)
  readonly remark: string;
}
