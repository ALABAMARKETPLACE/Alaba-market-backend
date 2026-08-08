import { ApiProperty } from "@nestjs/swagger";
import { IsEmail } from "class-validator";

import { BudPayVerifyDto } from "./budpay-verify.dto";

export class BudPayGuestVerifyDto extends BudPayVerifyDto {
  @ApiProperty({ description: "Email used to initialize the guest checkout" })
  @IsEmail()
  // tslint:disable-next-line:variable-name
  guest_email: string;
}
