import { ApiProperty } from "@nestjs/swagger";

export class CreatePaymentLogDto {
  @ApiProperty()
  readonly addressId: number;

  @ApiProperty()
  readonly cart: JSON;

  @ApiProperty()
  readonly ref: string;

  @ApiProperty()
  readonly charges: JSON;
}
