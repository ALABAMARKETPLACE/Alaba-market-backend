import { ApiProperty } from "@nestjs/swagger";

export class CancelOrderDto {
  @ApiProperty()
  readonly remark: string;
}
