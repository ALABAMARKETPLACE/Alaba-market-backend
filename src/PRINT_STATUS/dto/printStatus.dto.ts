import { ApiProperty } from "@nestjs/swagger";
import { PrintStatus } from "../print_status.entity";

export class PrintStatusDto {
  @ApiProperty()
  readonly id: number;

  @ApiProperty()
  readonly printId: number;

  @ApiProperty()
  readonly status: string;

  @ApiProperty()
  readonly remark: string;

  constructor(print_status: PrintStatus) {
    this.id = print_status.id;
    this.printId = print_status.printId;
    this.status = print_status.status;
    this.remark = print_status.remark;
  }
}
