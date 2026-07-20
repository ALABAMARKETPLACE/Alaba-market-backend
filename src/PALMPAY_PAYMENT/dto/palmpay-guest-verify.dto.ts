import { ApiProperty } from "@nestjs/swagger";
import { IsEmail } from "class-validator";

import { PalmPayVerifyDto } from "./palmpay-verify.dto";

export class PalmPayGuestVerifyDto extends PalmPayVerifyDto {
  @ApiProperty({ description: "Email used to initialize the guest checkout" })
  @IsEmail()
  // tslint:disable-next-line:variable-name
  guest_email: string;
}
