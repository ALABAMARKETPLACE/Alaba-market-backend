import { ApiProperty } from "@nestjs/swagger";
import { IsOptional } from "class-validator";

export class UpdatePaymentLogDto {
    @ApiProperty()
    @IsOptional()
    readonly userId: number;
  
    @ApiProperty()
    @IsOptional()
    readonly addressId: number;
  
    @ApiProperty()
    @IsOptional()
    readonly cart: JSON;
  
    @ApiProperty()
    @IsOptional()
    readonly ref: string;
  
    @ApiProperty()
    @IsOptional()
    readonly charges: JSON;
  
    }