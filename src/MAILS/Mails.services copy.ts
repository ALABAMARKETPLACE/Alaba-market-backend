import { MailerService } from "@nestjs-modules/mailer";
import { Injectable } from "@nestjs/common";
import { PdfService } from "./pdf.services";
// import { DataResponseDto } from "../shared/dto/data-response-dto";

@Injectable()
export class MailService {
  constructor(
    private mailerService: MailerService,
    private pdfService: PdfService
  ) {}

  async AuthMail(data: any) {
    try {
      await this.mailerService.sendMail({
        to: data?.to,
        subject: data?.subject,
        text: `${process.env.NAME} notification`,
        html: data?.template,
      });
    } catch (err) {
    }
  }

  async InviteUserMail(data: any) {
    try {
      await this.mailerService.sendMail({
        to: data?.to,
        subject: data?.subject,
        text: `${process.env.NAME} notification`,
      });
    } catch (err) {
    }
  }
  async RequestDocumentMail(data: any) {
    try {
      await this.mailerService.sendMail({
        to: data?.to,
        subject: data?.subject,
        text: `${process.env.NAME} notification`,
        html: data?.template,
      });
    } catch (err) {
      console.log("failed to send mail", err);
    }
  }
  async updateEmailNotify(data: any) {
    try {
      await this.mailerService.sendMail({
        to: data?.to,
        subject: data?.subject,
        html: data.template,
      });
    } catch (err) {
    }
  }

  async sellerEmails(data: any) {
    try {
      await this.mailerService.sendMail({
        to: data?.to,
        subject: data?.subject,
        html: data.template,
      });
    } catch (err) {
    }
  }
  async sendInvoiceMail(data: any, pdftem, inovice_id: string) {
    try {
      let pdf: any = await this.pdfService.PdfGen(pdftem);
      await this.mailerService.sendMail({
        to: data?.to,
        subject: "Mysubject",
        text: `${process.env.NAME} Notification`,
        html: data?.template,
        attachments: [
          {
            filename: `${inovice_id}.pdf`,
            content: Buffer.from(pdf?.data, "base64"),
            contentType: "application/pdf",
          },
        ],
      });
    } catch (err) {}
  }
}
