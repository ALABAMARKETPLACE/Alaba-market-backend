import { Transform } from "class-transformer";
import { IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class DiagnosePaystackTransactionDto {
  @ApiProperty({
    description: "Single Paystack transaction reference to inspect",
    example: "guest_171234567890_abcd",
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  reference: string;
}
