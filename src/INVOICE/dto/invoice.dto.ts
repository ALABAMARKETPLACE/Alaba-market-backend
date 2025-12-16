import { ApiProperty } from "@nestjs/swagger";
import { Invoice } from "../invoice.entity";

export class invoiceDto{
    @ApiProperty()
    readonly from_mail:string;
    
    @ApiProperty()
    readonly to_mail:string;

    @ApiProperty()
    readonly from_name:string;

    @ApiProperty()
    readonly to_name:string;

    @ApiProperty()
    readonly due_date:Date;

    @ApiProperty()
    readonly invoice_id:string;

    @ApiProperty()
    readonly invoice_address: string;
  
    @ApiProperty()
    readonly delivery_address: string;
  
    @ApiProperty()
    readonly sub_total: number;
  
    @ApiProperty()
    readonly total_vat: number;

    @ApiProperty()
    readonly total_quantity: number;
  
    @ApiProperty()
    readonly overall_discount: number;
  
    @ApiProperty()
    readonly total_amount: number;
    @ApiProperty()
    readonly issue_date:Date;

    constructor(invoice:Invoice){
        this.from_mail=invoice.from_mail;
        this.to_mail=invoice.to_mail;
        this.from_name=invoice.from_name;
        this.to_name=invoice.to_name;
        this.due_date=invoice.due_date;
        this.invoice_id=invoice.invoice_id;
        this.invoice_address=invoice.invoice_address;
        this.delivery_address=invoice.delivery_address;
        this.sub_total=invoice.sub_total;
        this.total_vat=invoice.total_vat;
        this.overall_discount=invoice.overall_discount;
        this.total_amount=invoice.total_amount;
        this.issue_date=invoice.issue_date;
        this.total_quantity=invoice.total_quantity;
    }
}