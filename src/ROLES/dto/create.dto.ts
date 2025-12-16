import { ApiProperty } from "@nestjs/swagger";

export class CreateRolesDto {
  @ApiProperty()
  readonly store_id: number;

  @ApiProperty()
  readonly name: string;
  
  @ApiProperty()
  readonly isEditable: boolean;
}
