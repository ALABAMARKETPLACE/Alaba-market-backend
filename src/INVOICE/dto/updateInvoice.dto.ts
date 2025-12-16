import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsEmail, IsOptional, IsString } from "class-validator";
import { InvoiceItem } from "./invoiceItem.dto";
import { UpdateInvoiceItemsDto } from "./updateInvoiceItem.dto";

export class UpdateInvoiceDto{
    @ApiProperty()
    @IsOptional()
    @IsEmail()
    readonly from_mail:string;
    
    @ApiProperty()
    @IsOptional()
    @IsEmail()
    readonly to_mail:string;

    @ApiProperty()
    @IsOptional()
    @IsString()
    readonly from_name:string;

    @ApiProperty()
    @IsOptional()
    @IsString()
    readonly to_name:string;

    @ApiProperty()
    @IsOptional()
    @IsDateString()
    readonly due_date:Date;

    // @ApiProperty()
    // @IsOptional()
    // @IsDateString()
    // readonly issue_date:Date;

    // @ApiProperty()
    // @IsOptional()
    // @IsString()
    // readonly invoice_id:string;

    @ApiProperty()
    @IsOptional()

    @IsString()
    readonly invoice_address: string;
  
    @ApiProperty()
    @IsOptional()
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
    readonly invoice_item:UpdateInvoiceItemsDto[];
}