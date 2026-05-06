import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class VerifyBoosterDto {
  @ApiProperty({ example: "seller_booster_1714800000000_ab12cd" })
  @IsString()
  @IsNotEmpty()
  reference: string;
}
