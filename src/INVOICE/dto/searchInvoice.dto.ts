import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional } from "class-validator";
import { PageOptionsDto } from "../../shared/dto/pageOptions.dto";

export class PageOptionsInvoiceDto extends PageOptionsDto {
  @ApiPropertyOptional()
  @IsOptional()
  readonly invoiceId?: string;
}
