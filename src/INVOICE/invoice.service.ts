import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { Invoice } from "./invoice.entity";
import { CreateInvoiceDto } from "./dto/createInvoice.dto";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { UpdateInvoiceDto } from "./dto/updateInvoice.dto";
import { Model, Op, Transaction } from "sequelize";
import { InvoiceItemsService } from "../INVOICE_ITEMS/invoiceitems.service";
import { InvoiceItems } from "../INVOICE_ITEMS/invoiceitems.entity";
import { MailService } from "../MAILS/Mails.services";
import { invoicePdf } from "../MAILS/pdf/invoicepdf";
import { InvoiceHtml } from "../MAILS/templates/invoice/invoiceTemplate";
import { PageOptionsInvoiceDto } from "./dto/searchInvoice.dto";
import { getErrorMessage } from "../shared/helpers/errormessage";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class InvoiceService {
  constructor(
    @Inject("InvoiceRepository")
    private readonly InvoiceRepository: typeof Invoice,
    private readonly invoiceItemsService: InvoiceItemsService,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService
  ) {}

  async create(data: CreateInvoiceDto) {
    let inovice_id = "NXME000125";
    try {
      //creating a unique invoice id
      const result = await this.InvoiceRepository.sequelize.transaction(
        async (transaction: Transaction) => {
          const latest: Invoice[] = await this.InvoiceRepository.findAll({
            order: [["createdAt", "DESC"]],
            limit: 1,
            transaction,
          });
          if (latest.length) {
            inovice_id += latest[0].id;
          }
          //creating new invoice
          const invoice = new Invoice();
          invoice.from_mail = data.from_mail;
          invoice.to_mail = data.to_mail;
          invoice.from_name = data.from_name;
          invoice.to_name = data.to_name;
          invoice.due_date = data.due_date;
          invoice.invoice_id = inovice_id;
          invoice.invoice_address = data.invoice_address;
          invoice.delivery_address = data.delivery_address;
          invoice.sub_total = 0;
          invoice.total_vat = 0;
          invoice.overall_discount = 0;
          invoice.total_amount = 0;
          invoice.total_quantity = 0;
          const newInvoice = await invoice.save({ transaction });
          //inserting invoice items
          const details = await this.invoiceItemsService.create(
            data.invoice_item,
            newInvoice,
            transaction
          );
          //updating the total amount and tax..etc
          newInvoice.total_quantity = details.total_quantity;
          newInvoice.total_amount = details.total_amount;
          newInvoice.total_vat = details.total_vat;
          newInvoice.overall_discount = details.overall_discount;
          newInvoice.sub_total = details.subtotal;
          await newInvoice.save({ transaction });
          details["newInvoice"] = newInvoice;
          transaction.afterCommit(async () => {
            const pdf = invoicePdf(details);
            const token = this.jwtService.sign({
              data: { id: newInvoice.invoice_id },
            });
            const template = await InvoiceHtml(newInvoice, token);
            this.mailService.sendInvoiceMail(template, pdf, inovice_id);
          });
          return newInvoice;
        }
      );
      return new DataResponseDto(result, true, "Sucessfully Created");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }
  async findAll(pageOptionsDto: PageOptionsInvoiceDto) {
    const { invoiceId } = pageOptionsDto;
    let where: any = {};
    if (invoiceId) {
      where = {
        [Op.or]: [
          { invoice_id: { [Op.iLike]: `%${invoiceId}%` } },
          { to_name: { [Op.iLike]: `%${invoiceId}%` } },
        ],
      };
    }
    const skip = (pageOptionsDto.page - 1) * pageOptionsDto.take;
    try {
      const { rows, count } = await this.InvoiceRepository.findAndCountAll({
        limit: pageOptionsDto.take,
        offset: skip,
        order: [["createdAt", pageOptionsDto.order]],
        where: where,
      });
      return new DataResponseDto(rows, true, "Success", pageOptionsDto, count);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }
  async findOne(id: number) {
    try {
      const response = await this.InvoiceRepository.findOne({
        where: {
          id: id,
        },
        include: [{ model: InvoiceItems, required: true }],
      });
      if (!response)
        throw new HttpException("no ID found", HttpStatus.NOT_FOUND);
      return new DataResponseDto(response, true, "Sucessfully fetched");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }
  async update(updateData: UpdateInvoiceDto, id: number) {
    try {
      const invoice = await this.InvoiceRepository.findByPk<Invoice>(id, {});
      if (!invoice) {
        throw new HttpException("no ID found", HttpStatus.NOT_FOUND);
      }
      const result = await this.InvoiceRepository.sequelize.transaction(
        async (transaction: Transaction) => {
          //updating invoice
          invoice.from_mail = updateData.from_mail;
          invoice.to_mail = updateData.to_mail;
          invoice.from_name = updateData.from_name;
          invoice.to_name = updateData.to_name;
          invoice.due_date = updateData.due_date;
          invoice.invoice_address = updateData.invoice_address;
          invoice.delivery_address = updateData.delivery_address;
          const newInvoice = await invoice.save({ transaction });
          //inserting invoice items
          const details = await this.invoiceItemsService.update(
            updateData.invoice_item,
            newInvoice,
            transaction
          );
          //updating the total amount and tax..etc
          newInvoice.total_quantity = details.total_quantity;
          newInvoice.total_amount = details.total_amount;
          newInvoice.total_vat = details.total_vat;
          newInvoice.overall_discount = details.overall_discount;
          newInvoice.sub_total = details.subtotal;
          await newInvoice.save({ transaction });
          details["newInvoice"] = newInvoice;
          transaction.afterCommit(async () => {
            const pdf = invoicePdf(details);
            const token = this.jwtService.sign({
              data: { id: newInvoice.invoice_id },
            });
            const template = await InvoiceHtml(newInvoice, token);
            this.mailService.sendInvoiceMail(template, pdf, invoice.invoice_id);
          });
          return newInvoice;
        }
      );
      return new DataResponseDto(result, true, "Sucessfully Updated");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }
  async delete(id: number) {
    try {
      const invoice = await this.InvoiceRepository.findByPk(id);
      if (!invoice) {
        throw new HttpException("No ID found", HttpStatus.NOT_FOUND);
      }
      await invoice.destroy();
      return new DataResponseDto(invoice, true, "Sucessfully Deleted");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }
  async getInvoice(token: string) {
    try {
      const verified = this.jwtService.verify(token);
      if (!verified)
        return new DataResponseDto({}, false, "Unable to get Invoice");
      const invoice = await this.InvoiceRepository.findOne({
        where: {
          invoice_id: verified.data?.id,
        },
        include: [
          {
            model: InvoiceItems,
            required: true,
          },
        ],
      });
      if (!invoice) return new DataResponseDto({}, false, "No invoice found");
      return new DataResponseDto(invoice, true, "Successfull");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }
}
