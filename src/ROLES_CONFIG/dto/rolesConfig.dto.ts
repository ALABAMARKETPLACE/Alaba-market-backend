import { ApiProperty } from "@nestjs/swagger";

export class RolesConfigDto {
  @ApiProperty()
  readonly role_id: number;

  @ApiProperty()
  readonly menu: any;
}
