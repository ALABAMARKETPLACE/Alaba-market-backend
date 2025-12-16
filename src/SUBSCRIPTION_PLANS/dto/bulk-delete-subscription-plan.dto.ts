import { ApiProperty } from "@nestjs/swagger";
import { IsArray, ArrayMinSize, IsNumber } from "class-validator";

export class BulkDeleteSubscriptionPlanDto {
  @ApiProperty({ type: [Number], example: [1, 2, 3] })
  @IsArray()
  @ArrayMinSize(1, { message: "At least one ID is required" })
  @IsNumber({}, { each: true })
  readonly ids: number[];
}
