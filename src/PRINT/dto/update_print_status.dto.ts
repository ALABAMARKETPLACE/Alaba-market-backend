import { ApiProperty } from "@nestjs/swagger";

export class UpdatePrintStatus {
  @ApiProperty()
  readonly status: string;

  @ApiProperty()
  readonly remark: string;

  @ApiProperty()
  readonly delivery_date: Date;
}
