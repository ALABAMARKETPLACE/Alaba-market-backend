import { ApiProperty } from "@nestjs/swagger";
import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { InvoiceItem } from "./invoiceItem.dto";

export class CreateInvoiceDto {
  // @ApiProperty()
  // @IsNotEmpty()
  // @IsString()
  // readonly invoice_id: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  readonly from_mail: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  readonly to_mail: string;

  @ApiProperty()
  @IsString()
  readonly from_name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly to_name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  readonly due_date: Date;

  @ApiProperty()
  @IsString()
  readonly invoice_address: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  readonly delivery_address: string;

  // @ApiProperty()
  // @IsOptional()
  // @IsNumber()
  // readonly sub_total: number;

  // @ApiProperty()
  // @IsOptional()
  // @IsNumber()
  // readonly total_vat: number;

  // @ApiProperty()
  // @IsOptional()
  // @IsNumber()
  // readonly overall_discount: number;

  // @ApiProperty()
  // @IsOptional()
  // @IsNumber()
  // readonly total_amount: number;

  @ApiProperty()
  @IsOptional()
  @IsDateString()
  readonly issue_date: Date;

  @ApiProperty()
  readonly invoice_item: InvoiceItem[];
}

