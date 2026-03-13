import { ApiProperty } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { CreateOrderDto } from "../../ORDER/dto/createOrder.dto";

export class PaystackUserInitializeDto {
  @ApiProperty({
    description:
      "Full logged-in order payload. The backend validates it, initializes Paystack, and the webhook creates the real orders.",
    type: CreateOrderDto,
  })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CreateOrderDto)
  order_payload: CreateOrderDto;

  @ApiProperty({
    description: "Callback URL for payment completion",
    required: false,
  })
  @IsOptional()
  @IsString()
  callback_url?: string;

  @ApiProperty({
    description: "Optional payment reference override",
    required: false,
  })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiProperty({
    description: "Additional metadata",
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
