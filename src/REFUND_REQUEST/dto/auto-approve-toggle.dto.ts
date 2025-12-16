import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty } from "class-validator";
import { Transform } from "class-transformer";

export class AutoApproveToggleDto {
  @ApiProperty({
    description: "Enable or disable auto-approve for refunds",
    example: true,
  })
  @IsNotEmpty({ message: "Auto approve value is required" })
  @IsBoolean({ message: "Auto approve must be a boolean value" })
  @Transform(({ value }) => {
    if (value === "true") return true;
    if (value === "false") return false;
    return value;
  })
  readonly auto_approve: boolean;
}
