import { ApiProperty } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export class PaystackRefundDto {
  @ApiProperty({ description: "Transaction reference or ID" })
  @IsString()
  @IsNotEmpty()
  transaction: string;

  @ApiProperty({
    description: "Amount to refund in kobo (optional for full refund)",
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(100)
  amount?: number;

  @ApiProperty({ description: "Reason for refund", required: false })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({
    description: "Currency code",
    default: "NGN",
    required: false,
  })
  @IsOptional()
  @IsString()
  currency?: string;
}

export class PaystackRefundResponseDto {
  @ApiProperty()
  status: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty()
  data: {
    transaction: {
      id: number;
      domain: string;
      reference: string;
      amount: number;
      paid_at: string;
      channel: string;
      currency: string;
      authorization: any;
      customer: any;
      plan: any;
    };
    integration: number;
    deducted_amount: number;
    channel: string;
    merchant_note: string;
    customer_note: string;
    status: string;
    refunded_by: string;
    expected_at: string;
    currency: string;
    domain: string;
    amount: number;
    fully_deducted: boolean;
    id: number;
    createdAt: string;
    updatedAt: string;
  };
}
