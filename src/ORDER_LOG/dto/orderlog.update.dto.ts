import { ApiProperty } from "@nestjs/swagger";
import { IsOptional } from "class-validator";

export class UpdateOrderLogDto {
    @ApiProperty()
    @IsOptional()
    readonly userId: number;
  
    @ApiProperty()
    @IsOptional()
    readonly address: JSON;
  
    @ApiProperty()
    @IsOptional()
    readonly cart: JSON;
  
    @ApiProperty()
    @IsOptional()
    readonly payment: JSON;
  
    @ApiProperty()
    @IsOptional()
    readonly charges: JSON;
  
    }