import { ApiProperty } from "@nestjs/swagger";
import { IsObject, IsOptional, IsString } from "class-validator";

export class BudPayWebhookDto {
  @ApiProperty({ example: "transaction" })
  @IsString()
  notify: string;

  @ApiProperty({ example: "successful" })
  @IsString()
  notifyType: string;

  @ApiProperty()
  @IsObject()
  data: Record<string, any>;

  @ApiProperty({ required: false })
  @IsOptional()
  transferDetails?: Record<string, any>;
}
