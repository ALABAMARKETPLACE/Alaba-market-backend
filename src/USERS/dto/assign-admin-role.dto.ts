import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsOptional } from "class-validator";

export class AssignAdminRoleDto {
  @ApiPropertyOptional({
    example: true,
    description:
      "When true, the assigned admin role becomes the user's active role immediately.",
  })
  @IsOptional()
  @IsBoolean()
  readonly make_active_role?: boolean;
}
