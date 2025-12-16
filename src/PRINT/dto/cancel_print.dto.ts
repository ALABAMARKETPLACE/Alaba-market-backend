import { ApiProperty } from "@nestjs/swagger";

export class CancelPrintDto {
  @ApiProperty()
  readonly remark: string;
}
