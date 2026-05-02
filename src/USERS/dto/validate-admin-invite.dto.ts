import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class ValidateAdminInviteDto {
  @ApiProperty()
  @IsNotEmpty({ message: "Unauthorized Access" })
  readonly token: string;
}
