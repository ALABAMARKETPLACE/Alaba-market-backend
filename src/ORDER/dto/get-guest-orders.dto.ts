import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { Transform } from "class-transformer";

export class GetGuestOrdersDto {
  @ApiProperty({
    description: "Guest email address used during checkout",
    example: "guest@example.com",
  })
  @IsEmail({}, { message: "Please provide a valid email address" })
  @IsNotEmpty({ message: "Email is required" })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @ApiProperty({
    description:
      "Optional order ID for specific order lookup (e.g., ORD-123456)",
    example: "ORD-123456",
    required: false,
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim()) // ✅ Auto-trim whitespace
  order_id?: string;
}
