import { ApiProperty } from "@nestjs/swagger";
import { States } from "../states.entity";

export class StatesDto {
  @ApiProperty()
  readonly id: number;

  @ApiProperty()
  readonly name: string;

  @ApiProperty()
  readonly description: string;

  constructor(states: States) {
    this.id = states.id;
    this.name = states.name;
    this.description = states.description;
  }
}
