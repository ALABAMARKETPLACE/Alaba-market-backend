import { HttpException, HttpStatus, Inject, Injectable, InternalServerErrorException } from "@nestjs/common";
import { InvoiceItems } from "./invoiceitems.entity";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { CreateInvoiceItemsDto } from "./dto/createInvoiceItems.dto";
import { InvoiceItemsDto } from "./dto/invoiceitems.dto";
import { MailService } from "../MAILS/Mails.services";
import { Invoice } from "../INVOICE/invoice.entity";
import { Transaction } from "sequelize";
import { UpdateInvoiceItemsDto } from "./dto/updateInvoiceItem.dto";
import { getErrorMessage } from "../shared/helpers/errormessage";

@Injectable()
export class InvoiceItemsService {
  constructor(
    @Inject("InvoiceItemsRepository")
    private readonly InvoiceItemsRepository: typeof InvoiceItems,
    private readonly mailService: MailService
  ) {}

  async findAll() {
    try {
      const invoiceitems = await this.InvoiceItemsRepository.findAll({
        limit: 20,
      });
      const data = invoiceitems.map(
        (item: InvoiceItems) => new InvoiceItemsDto(item)
      );
      return new DataResponseDto(data, true, "Successfully");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async findOne(id: number) {
    try {
      const invoiceitems = await this.InvoiceItemsRepository.findByPk(id);
      if (!invoiceitems)
        throw new HttpException("No ID found", HttpStatus.NOT_FOUND);
      return new DataResponseDto(invoiceitems, true, "Successfully fetched");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async create(
    data: CreateInvoiceItemsDto[],
    invoice: Invoice,
    transaction: Transaction
  ) {
    try {
      let subtotal = 0;
      let total_vat = 0;
      let overall_discount = 0;
      let total_amount = 0;
      let total_quantity = 0;
      const newItems = [];
      if (!Array.isArray(data)) throw new Error("Failed to add invoice items");
      for (const item of data) {
        const invoiceitems = new InvoiceItems();
        invoiceitems.product = item.product;
        invoiceitems.title = item.title;
        invoiceitems.quantity = item.quantity;
        invoiceitems.unitPrice = item.unitPrice;
        invoiceitems.delivery_charge = item.delivery_charge;
        invoiceitems.discount = item.discount;
        invoiceitems.tax = item.tax;
        invoiceitems.total = 0; //calculation is on model
        invoiceitems.invoiceId = invoice.invoice_id;
        const created = await invoiceitems.save({ transaction });
        newItems.push(created);
        //===================================
        total_quantity += item.quantity;
        subtotal += item.quantity * item.unitPrice;
        total_vat +=
          ((item.unitPrice / 100) * item.tax * item.quantity * 100) / 100;
        overall_discount += item.discount * item.quantity;
        total_amount += invoiceitems.total;
      }
      return {
        subtotal,
        total_vat,
        overall_discount,
        total_amount,
        total_quantity,
        newItems,
      };
    } catch (err) {
      throw new Error("Failed to add invoice items");
    }
  }
  async update(
    data: UpdateInvoiceItemsDto[],
    invoice: Invoice,
    transaction: Transaction
  ) {
    try {
      let subtotal = 0;
      let total_vat = 0;
      let overall_discount = 0;
      let total_amount = 0;
      let total_quantity = 0;
      const newItems = [];
      if (!Array.isArray(data)) throw new Error("empty invoice items");
      for (const item of data) {
        let invoiceitems: any;
        if (item.id) {
          invoiceitems = await this.InvoiceItemsRepository.findByPk(item.id);
        } else {
          invoiceitems = new InvoiceItems();
          invoiceitems.invoiceId = invoice.invoice_id;
        }

        invoiceitems.product = item.product;
        invoiceitems.title = item.title;
        invoiceitems.quantity = item.quantity;
        invoiceitems.unitPrice = item.unitPrice;
        invoiceitems.delivery_charge = item.delivery_charge;
        invoiceitems.discount = item.discount;
        invoiceitems.tax = item.tax;
        invoiceitems.total = 0; //calculation is on model
        const created = await invoiceitems.save({ transaction });
        newItems.push(created);
        //===================================
        total_quantity += item.quantity;
        subtotal += item.quantity * item.unitPrice;
        total_vat +=
          ((item.unitPrice / 100) * item.tax * item.quantity * 100) / 100;
        overall_discount += item.discount * item.quantity;
        total_amount += invoiceitems.total;
      }
      return {
        subtotal,
        total_vat,
        overall_discount,
        total_amount,
        total_quantity,
        newItems,
      };
    } catch (err) {
      throw new Error("Failed to update invoice items");
    }
  }
}
