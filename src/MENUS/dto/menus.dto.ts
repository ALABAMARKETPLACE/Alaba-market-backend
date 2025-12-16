import { Menus } from "../menus.entity";
import { ApiProperty } from "@nestjs/swagger";

export class MenusDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  readonly name: string;

  @ApiProperty()
  readonly route: string;

  @ApiProperty()
  readonly icon: string;

  constructor(menus: Menus) {
    this.id = menus.id;
    this.name = menus.name;
    this.route = menus.route;
    this.icon=menus.icon;
  }
}
