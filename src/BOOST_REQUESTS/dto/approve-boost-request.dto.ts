import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsInt, IsOptional, IsString, Min } from "class-validator";
import { Type } from "class-transformer";

export class ApproveBoostRequestDto {
  @ApiProperty({
    description: "Boost request ID",
    example: 1,
  })
  @IsInt()
  @Type(() => Number)
  readonly id: number;

  @ApiProperty({
    description: "Approval action",
    enum: ["approved", "rejected"],
    example: "approved",
  })
  @IsIn(["approved", "rejected"])
  readonly status: "approved" | "rejected";

  @ApiProperty({
    description: "Optional admin remarks",
    required: false,
    example: "Approved for promotion campaign",
  })
  @IsOptional()
  @IsString()
  readonly remarks?: string;

  @ApiProperty({
    description: "Optional admin-set priority for boosted ordering (lower = higher)",
    required: false,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  readonly priority?: number;
}
