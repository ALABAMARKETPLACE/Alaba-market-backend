import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class PalmPayVerifyDto {
  @ApiProperty({ description: "Merchant order ID sent to PalmPay" })
  @IsString()
  @IsNotEmpty()
  reference: string;
}
