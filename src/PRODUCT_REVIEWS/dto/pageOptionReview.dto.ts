import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { UUID } from "crypto";
import { PageOptionsDto } from "../../shared/dto/pageOptions.dto";

export class PageOptionsDtoReview extends PageOptionsDto {
  @ApiProperty()
  @Type(() => String)
  readonly productId: UUID;
}
