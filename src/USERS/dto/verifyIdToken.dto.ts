import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class VerityDeactivateIdToken {
  @ApiProperty()
  @IsNotEmpty({ message: "UnAuthorized Access" })
  readonly idToken: string;
}
