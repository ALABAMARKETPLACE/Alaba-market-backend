import { ApiProperty } from "@nestjs/swagger";

export class CreateBusinessTypeDto {
  @ApiProperty()
  readonly name: string;

  @ApiProperty()
  readonly description: string;
}
