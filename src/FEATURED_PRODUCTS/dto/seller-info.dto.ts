import { ApiProperty } from "@nestjs/swagger";

export class SellerInfoDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ required: false })
  logo?: string;
}

