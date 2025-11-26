import { PartialType } from '@nestjs/swagger';
import { CreateTrackingDto } from './create-log.dto';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';

export class UpdateTrackingDto extends PartialType(CreateTrackingDto) {
//       @IsOptional()
//   @IsEnum(TrackingStatus)
//   status?: TrackingStatus;

//   @IsOptional()
//   @IsDateString()
//   estimatedDeliveryTime?: string;

//   @IsOptional()
//   @IsDateString()
//   actualDeliveryTime?: string; // <-- ADD THIS
}

