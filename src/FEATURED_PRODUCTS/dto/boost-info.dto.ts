import { ApiProperty } from "@nestjs/swagger";

export class BoostInfoDto {
  @ApiProperty()
  boost_request_id: number;

  @ApiProperty()
  boost_priority: number;

  @ApiProperty({ description: "Calculated end date: approved_at + plan.duration_days" })
  boost_end_date: Date;

  @ApiProperty()
  plan_name: string;

  @ApiProperty({ description: "When the boost was approved" })
  approved_at: Date;

  @ApiProperty({ description: "Number of days the boost will run" })
  duration_days: number;
}
