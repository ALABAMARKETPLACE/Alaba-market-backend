import { ApiProperty } from "@nestjs/swagger";
import {
  IsEmail,
  IsJWT,
  IsNotEmpty,
  IsString,
  MaxLength,
  Validate,
} from "class-validator";
import { ContainsPlusValidator } from "../../shared/validator/custom-validators";

export class RefreshTokenDto {
  @IsJWT()
  @ApiProperty()
  readonly refreshToken: string;
}
