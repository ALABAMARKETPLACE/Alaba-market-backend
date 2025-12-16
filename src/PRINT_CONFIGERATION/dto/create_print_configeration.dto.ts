import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreatePrintConfigerationDto {
  @ApiProperty({
    example: "A4",
    description: "Type of the print (e.g., A4, A3, Legal, etc.)",
  })
  @IsString()
  @IsNotEmpty()
  printType: string;

  @ApiProperty({
    example: "color",
    description: "Print color type: either 'blackandwhite' or 'color'",
    enum: ["blackandwhite", "color"],
  })
  @IsEnum(["blackandwhite", "color"], {
    message: "Print color must be one of: blackandwhite, color",
  })
  printColor: "blackandwhite" | "color";

  @ApiProperty({
    example: true,
    description: "Whether the print is in large size (true/false)",
  })
  @IsNotEmpty()
  doublesided: boolean;

  @ApiProperty({
    example: 10,
    description: "Price for the given print type and color",
  })
  @IsNumber()
  amount: number;
}
