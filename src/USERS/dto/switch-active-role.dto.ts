import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsNotEmpty } from "class-validator";

export class SwitchActiveRoleDto {
  @ApiProperty({
    example: "seller",
    enum: ["buyer", "seller", "admin"],
  })
  @IsNotEmpty()
  @IsIn(["buyer", "seller", "admin"])
  readonly role: string;
}
