import { ApiProperty } from "@nestjs/swagger";
import {
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { CreateOrderDto } from "../../ORDER/dto/createOrder.dto";

const hasTopLevelOrderPayload = (obj: any) => {
  return Boolean(obj?.cart && obj?.payment && obj?.address && obj?.charges);
};

export class PaystackUserInitializeDto {
  @ApiProperty({
    description:
      "Optional payment provider selector. Missing values remain Paystack for backward compatibility.",
    enum: ["paystack", "budpay"],
    required: false,
  })
  @IsOptional()
  @IsIn(["paystack", "budpay"])
  payment_provider?: "paystack" | "budpay";

  @ApiProperty({
    description: "Alias for payment_provider.",
    enum: ["paystack", "budpay"],
    required: false,
  })
  @IsOptional()
  @IsIn(["paystack", "budpay"])
  payment_channel?: "paystack" | "budpay";

  @ApiProperty({
    description:
      "Full logged-in order payload. The backend validates it, initializes Paystack, and the webhook creates the real orders.",
    type: CreateOrderDto,
  })
  @ValidateIf((obj) => !hasTopLevelOrderPayload(obj))
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CreateOrderDto)
  order_payload: CreateOrderDto;

  @ApiProperty({
    description:
      "Browser redirect URL after payment. For backend-only testing, use /paystack/success on this API.",
    example: "http://localhost:8000/paystack/success",
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
