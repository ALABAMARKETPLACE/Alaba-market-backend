import { ApiProperty } from "@nestjs/swagger";

export class RotationInfoDto {
  @ApiProperty({ description: "Current batch index being shown" })
  current_batch_index: number;

  @ApiProperty({ description: "Total number of batches available" })
  total_batches: number;

  @ApiProperty({ description: "Actual number of products in current batch" })
  actual_batch_size: number;

  @ApiProperty({ description: "Expected batch size (usually 5)" })
  expected_batch_size: number;

  @ApiProperty({ description: "Total number of products available for this plan" })
  total_products: number;

  @ApiProperty({ description: "Rotation interval in minutes" })
  rotation_interval_minutes: number;

  @ApiProperty({ description: "ISO timestamp of next rotation", required: false })
  next_rotation_at: string | null;

  @ApiProperty({ description: "Seconds until next rotation" })
  seconds_until_next_rotation: number;
}

