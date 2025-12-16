import { ApiProperty } from "@nestjs/swagger";

export class CreateOrderType {
  @ApiProperty()
  currencyCode: string;

  @ApiProperty()
  value: number;

  @ApiProperty()
  emailAddress: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;
  
  @ApiProperty()
  token: string;
}
