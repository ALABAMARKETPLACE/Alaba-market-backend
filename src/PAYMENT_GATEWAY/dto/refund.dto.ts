import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateRefundDto {
  @ApiProperty({
    description: "Payment reference ID to be refunded",
    example: "740b9a3c-a719-45c7-b387-25d1d3a23bca",
  })
  @IsNotEmpty()
  @IsString()
  paymentRef: string;

  @ApiProperty({
    description: "Order reference ID",
    example: "9dba1654-c4dc-4245-bfab-3c70fea58610",
  })
  @IsNotEmpty()
  @IsString()
  orderRef: string;

  @ApiProperty({
    description: "Amount to refund (in smallest currency unit)",
    example: 28710,
  })
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty({
    description: "Currency code for the refund",
    example: "AED",
  })
  @IsNotEmpty()
  @IsString()
  currencyCode: string;

  @ApiProperty({
    description: "Reason for the refund",
    example: "Customer request",
    required: false,
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
