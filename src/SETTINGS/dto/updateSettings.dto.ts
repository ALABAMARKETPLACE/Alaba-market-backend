import { ApiProperty } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class UpdateSettingsDto {
  @ApiProperty()
  @IsIn(["multi", "single"])
  @IsOptional()
  readonly type: string;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) =>
    value == "false" ? false : value == "true" ? true : value
  )
  readonly isLocation: boolean;

  @ApiProperty()
  @MaxLength(20)
  @IsString()
  @IsOptional()
  readonly currency: string;

  @ApiProperty()
  @IsEmail()
  @IsOptional()
  readonly adminEmail: string;

  @ApiProperty()
  @IsEmail()
  @IsOptional()
  readonly supportInfoEmail: string;

  @ApiProperty()
  @IsEmail()
  @IsOptional()
  readonly contactEmail: string;

  @ApiProperty()
  @MaxLength(20)
  @IsString()
  @IsOptional()
  readonly contactNumber: string;

  @ApiProperty()
  @MaxLength(100)
  @IsString()
  @IsOptional()
  readonly address: string;

  @ApiProperty()
  @IsInt()
  @Max(100000)
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  readonly radius: number;
}
