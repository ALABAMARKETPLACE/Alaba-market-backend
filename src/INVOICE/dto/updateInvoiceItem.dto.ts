import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional } from "class-validator";

export class UpdateInvoiceItemsDto {
    @ApiProperty()
  @IsOptional()
  readonly id: string;

  @ApiProperty()
  @IsOptional()
  readonly invoiceId: string;

  @ApiProperty()
  @IsOptional()
  readonly product: string;

  @ApiProperty()
  @IsOptional()
  readonly title: string;

  @ApiProperty()
  @IsOptional()
  readonly quantity: number;

  @ApiProperty()
  @IsOptional()
  readonly unitPrice: number;

  @ApiProperty()
  @IsOptional()
  readonly delivery_charge: number;

  @ApiProperty()
  @IsOptional()
  readonly discount: number;

  @ApiProperty()
  @IsOptional()
  readonly tax: number;

  @ApiProperty()
  @IsOptional()
  readonly total: number;
}
