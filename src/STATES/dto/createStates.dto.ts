import { ApiProperty } from "@nestjs/swagger";

export class CreateStatesDto {
  @ApiProperty()
  readonly name: string;

  @ApiProperty()
  readonly description: string;
}
