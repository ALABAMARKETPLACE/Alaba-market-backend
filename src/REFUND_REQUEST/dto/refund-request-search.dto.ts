import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  IsDateString,
} from "class-validator";
import { Transform } from "class-transformer";
import { PageOptionsDto } from "../../shared/dto/pageOptions.dto";

export class RefundRequestSearchPaginationDto extends PageOptionsDto {
  @ApiPropertyOptional({
    description: "Filter by order ID",
    example: 1234,
  })
  @IsOptional()
  @IsNumber({}, { message: "Order ID must be a number" })
  @Transform(({ value }) => (value ? parseInt(value) : undefined))
  order_id?: number;

  @ApiPropertyOptional({
    description: "Filter by status",
    enum: ["waiting_refund", "approved", "rejected", "completed"],
    example: "waiting_refund",
  })
  @IsOptional()
  @IsEnum(["waiting_refund", "approved", "rejected", "completed"], {
    message:
      "Status must be one of: waiting_refund, approved, rejected, completed",
  })
  status?: string;

  @ApiPropertyOptional({
    description: "Search by customer name",
    example: "John Doe",
  })
  @IsOptional()
  @IsString({ message: "Customer name must be a string" })
  @MaxLength(100, { message: "Customer name search query is too long" })
  @Transform(({ value }) => (typeof value == "string" ? value.trim() : value))
  customer_name?: string;

  @ApiPropertyOptional({
    description: "Filter by start date (YYYY-MM-DD)",
    example: "2023-01-01",
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: "From date must be a valid date string in format YYYY-MM-DD" }
  )
  @Transform(({ value }) => (typeof value == "string" ? value.trim() : value))
  from_date?: string;

  @ApiPropertyOptional({
    description: "Filter by end date (YYYY-MM-DD)",
    example: "2023-12-31",
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: "To date must be a valid date string in format YYYY-MM-DD" }
  )
  @Transform(({ value }) => (typeof value == "string" ? value.trim() : value))
  to_date?: string;
}
