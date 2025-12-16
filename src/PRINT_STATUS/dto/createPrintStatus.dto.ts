import { ApiProperty } from "@nestjs/swagger";

export class CreatePrintStatusDto {
  @ApiProperty()
  readonly printId: number;

  @ApiProperty()
  readonly status: string;

  @ApiProperty()
  readonly remark: string;
}
