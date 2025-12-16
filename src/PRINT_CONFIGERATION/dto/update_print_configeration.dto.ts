import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdatePrintConfigerationDto {
  @ApiPropertyOptional({ example: "A4" })
  @IsOptional()
  @IsString()
  printType?: string;

  @ApiPropertyOptional({ enum: ["blackandwhite", "color"] })
  @IsOptional()
  @IsEnum(["blackandwhite", "color"])
  printColor?: "blackandwhite" | "color";

  // @ApiPropertyOptional({ example: true })
  // @IsOptional()
  // printSize?: boolean;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  doublesided?: boolean;
}
