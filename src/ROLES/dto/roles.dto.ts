import { Roles } from "../roles.entity";
import { ApiProperty } from "@nestjs/swagger";

export class RolesDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  readonly store_id: number;

  @ApiProperty()
  readonly name: string;

  @ApiProperty()
  readonly isEditable: boolean;

  constructor(roles: Roles) {
    this.id = roles.id;
    this.store_id = roles.store_id;
    this.name = roles.name;
    this.isEditable = roles.isEditable;
  }
}
