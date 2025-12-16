import { ApiProperty } from "@nestjs/swagger";
import { IsOptional } from "class-validator";
import { PageOptionsDto } from "../../shared/dto/pageOptions.dto";

export class GetAllNewAddressDto extends PageOptionsDto {
  @ApiProperty({ required: false })
  @IsOptional()
  readonly query?: string;
}
