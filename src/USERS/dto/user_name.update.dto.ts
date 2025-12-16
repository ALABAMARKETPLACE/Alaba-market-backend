import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsDefined, MaxLength, ValidateIf } from "class-validator";

export class UserNameUpdateDto {
  @ApiPropertyOptional({ default: null })
  @Type(() => String)
  @MaxLength(50, {
    message: "FirstName is too long Please use another one.",
  })
  @ValidateIf((object) => !object?.last_name)
  @IsDefined({ message: "Either First name or Lastname should be provided" })
  readonly first_name?: string;

  @ApiPropertyOptional({ default: null })
  @Type(() => String)
  @MaxLength(50, {
    message: "LastName is too long Please use another one.",
  })
  @ValidateIf((object) => !object?.first_name)
  readonly last_name?: string;
}
