import { ApiProperty } from "@nestjs/swagger";

export class GetOrderDetails {
  @ApiProperty()
  ref: string;

  @ApiProperty()
  token: string;
}
