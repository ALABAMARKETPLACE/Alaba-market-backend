import { ApiProperty } from "@nestjs/swagger";
import { IsIn } from "class-validator";
import { Role } from "../../shared/enum/role.enum";

export class UpdateUserRoleDto {
  @ApiProperty({
    enum: [Role.SuperAdmin, Role.Admin, Role.Seller, Role.Customer],
    example: Role.Admin,
  })
  @IsIn([Role.SuperAdmin, Role.Admin, Role.Seller, Role.Customer, Role.User])
  role: Role;
}
