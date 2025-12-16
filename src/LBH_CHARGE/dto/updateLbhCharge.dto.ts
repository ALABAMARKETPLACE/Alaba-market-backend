import { ApiProperty } from "@nestjs/swagger";
import { IsOptional } from "class-validator";

export class UpdateLbhChargeDto {
  @ApiProperty()
  readonly id: number;

  @ApiProperty()
  @IsOptional()
  readonly length: string;
  
  @ApiProperty()
  @IsOptional()
  readonly breadth: string;
  
  @ApiProperty()
  @IsOptional()
  readonly height: string;
  
  @ApiProperty()
  @IsOptional()
  readonly operator: string;

  @ApiProperty()
  @IsOptional()
  readonly charge: string;
}
