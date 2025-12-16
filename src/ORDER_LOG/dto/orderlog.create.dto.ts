import { ApiProperty } from "@nestjs/swagger";

export class CreateOrderLogDto {
  @ApiProperty()
  readonly userId: number;

  @ApiProperty()
  readonly address: JSON;

  @ApiProperty()
  readonly cart: JSON;

  @ApiProperty()
  readonly payment: JSON;

  @ApiProperty()
  readonly charges: JSON;
}
