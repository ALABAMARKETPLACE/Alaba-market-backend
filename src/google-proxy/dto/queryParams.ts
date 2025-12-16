import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsString,
  Validate,
  ValidateIf,
} from "class-validator";
class CoordinatesOrPlaceIdValidator {
    validate(object: any) {
      const hasCoordinates =
        object.latitude !== undefined && object.longitude !== undefined;
      const hasPlaceId = object.place_id !== undefined && object.place_id !== null;
  
      return (hasCoordinates && !hasPlaceId) || (!hasCoordinates && hasPlaceId);
    }
  
    defaultMessage() {
      return "You must either provide both latitude and longitude, or place_id, but not both.";
    }
  }
export class GooglePlacePickerDto {
  @ApiProperty({ required: false })
  @Type(() => Number)
  @IsLatitude()
  @ValidateIf((o) => o.place_id === undefined || o.place_id === null)
  readonly latitude?: number;

  @ApiProperty({ required: false })
  @Type(() => Number)
  @IsLongitude()
  @ValidateIf((o) => o.place_id === undefined || o.place_id === null)
  readonly longitude?: number;

  @ApiProperty({ required: false })
  @IsNotEmpty()
  @IsString()
  @ValidateIf((o) => o.latitude === undefined && o.longitude === undefined)
  place_id?: string;

  @Validate(CoordinatesOrPlaceIdValidator)
  validateEitherCoordinatesOrPlaceId() {}
}


