import { ApiProperty } from "@nestjs/swagger";
import { IsOptional } from "class-validator";
export class UpdateOrderItemsDto {
  @ApiProperty()
  @IsOptional()
  readonly orderId: string;

  @ApiProperty()
  @IsOptional()
  readonly productId: number;

  @ApiProperty()
  @IsOptional()
  readonly quantity: number;

  @ApiProperty()
  @IsOptional()
  readonly price: number;

  @ApiProperty()
  @IsOptional()
  readonly image: string;

}
