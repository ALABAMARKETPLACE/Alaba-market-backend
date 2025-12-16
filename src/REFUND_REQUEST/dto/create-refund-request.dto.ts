import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsDecimal,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";
import { Transform } from "class-transformer";

export class CreateRefundRequestDto {
  @ApiProperty({
    description: "The order ID to request a refund for",
    example: 1,
  })
  @IsNotEmpty({ message: "Please provide an Order ID" })
  @IsNumber({}, { message: "Invalid Order ID" })
  @Transform(({ value }) => parseInt(value))
  readonly order_id: number;

  @ApiProperty({
    description: "The amount to refund",
    example: 100.0,
  })
  @IsOptional()
  @IsDecimal(
    { decimal_digits: "0,2" },
    { message: "Refund amount must be a valid decimal" }
  )
  @Transform(({ value }) => parseFloat(value))
  readonly refund_amount?: number;

  @ApiProperty({
    description: "Reason for the refund request",
    example: "Product received damaged",
  })
  @IsNotEmpty({ message: "Please provide a reason for the refund" })
  @IsString({ message: "Invalid reason format" })
  @MaxLength(500, {
    message: "Reason is too long, please be more concise",
  })
  @Transform(({ value }) => (typeof value == "string" ? value.trim() : value))
  readonly reason: string;
}
