import { InjectQueue } from "@nestjs/bull";
import { MailerService } from "@nestjs-modules/mailer";
import { Injectable, Logger } from "@nestjs/common";
import axios from "axios";
import { Queue } from "bull";
import FormData from "form-data";
import { MailtrapClient } from "mailtrap";
import {
  ENQUIRY_MAIL_JOB,
  ENQUIRY_MAIL_QUEUE,
  EnquiryMailJobData,
} from "./mail-queue.constants";
import { PdfService } from "./pdf.services";
// import { DataResponseDto } from "../shared/dto/data-response-dto";

type MailAttachment = {
  filename: string;
  content: Buffer;
  contentType?: string;
};

type MailPayload = {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: MailAttachment[];
};

type MailProvider = "smtp" | "mailgun" | "mailtrap" | "mailtrap_api";

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private mailerService: MailerService,
    private pdfService: PdfService,
    @InjectQueue(ENQUIRY_MAIL_QUEUE)
    private readonly enquiryMailQueue: Queue<EnquiryMailJobData>,
  ) {}

  private getConfiguredProvider(): MailProvider {
    const provider = process.env.MAIL_PROVIDER?.trim().toLowerCase();

    if (provider === "mailgun") return "mailgun";
    if (provider === "mailtrap") return "mailtrap";
    if (provider === "mailtrap_api" || provider === "mailtrap-api") {
      return "mailtrap_api";
    }

    return "smtp";
  }

  private parseProvider(value?: string): MailProvider | null {
    const provider = value?.trim().toLowerCase();

    if (!provider) return null;
    if (provider === "mailgun") return "mailgun";
    if (provider === "mailtrap") return "mailtrap";
    if (provider === "mailtrap_api" || provider === "mailtrap-api") {
      return "mailtrap_api";
    }
    if (provider === "smtp") return "smtp";

    return null;
  }

  private getFallbackProviders(primary: MailProvider): MailProvider[] {
    const configured = (process.env.MAIL_FALLBACK_PROVIDERS || "")
      .split(",")
      .map((item) => this.parseProvider(item))
      .filter((item): item is MailProvider => !!item && item !== primary);

    if (configured.length > 0) {
      return [...new Set(configured)];
    }

    if (primary === "mailtrap_api") {
      const providers: MailProvider[] = ["mailgun", "smtp"];
      return providers.filter((provider) => this.isProviderAvailable(provider));
    }

    if (primary === "mailgun") {
      const providers: MailProvider[] = ["smtp"];
      return providers.filter((provider) => this.isProviderAvailable(provider));
    }

    return [];
  }

  private isProviderAvailable(provider: MailProvider): boolean {
    if (provider === "mailtrap_api") {
      return !!process.env.MAILTRAP_API_TOKEN;
    }

    if (provider === "mailgun") {
      return !!process.env.MAILGUN_DOMAIN && !!process.env.MAILGUN_API_KEY;
    }

    if (provider === "mailtrap") {
      return !!process.env.MAILTRAP_HOST &&
        !!process.env.MAILTRAP_USER &&
        !!process.env.MAILTRAP_PASSWORD;
    }

    return !!process.env.MAILER_HOST &&
      !!process.env.MAILER_USER &&
      !!process.env.MAILER_PASSWORD;
  }

  private isRetryableProviderError(err: any): boolean {
    const message = String(err?.message || err || "").toLowerCase();
    const status = Number(err?.response?.status || err?.status || 0);

    if (status === 429 || status >= 500) return true;

    return [
      "reached its limit",
      "quota",
      "rate limit",
      "too many requests",
      "temporarily unavailable",
    ].some((pattern) => message.includes(pattern));
  }

  private getMailtrapApiFrom(): string {
    return (
      process.env.MAILTRAP_FROM ||
      process.env.MAILER_DEFAULT_FROM ||
      process.env.MAILER_USER ||
      "no-reply@alabamarketplace.ng"
    );
  }

  private getMailgunBaseUrl(): string {
    const base = process.env.MAILGUN_BASE_URL?.trim();
    if (base) return base;
    return process.env.MAILGUN_REGION?.toLowerCase() === "eu"
      ? "https://api.eu.mailgun.net"
      : "https://api.mailgun.net";
  }

  private getMailgunFrom(): string {
    return (
      process.env.MAILGUN_FROM ||
      process.env.MAILER_DEFAULT_FROM ||
      process.env.MAILER_USER ||
      "no-reply@alabamarketplace.ng"
    );
  }

  private normalizeTo(to: string | string[]): string {
    return Array.isArray(to) ? to.join(",") : to;
  }

  private parseEmailAddress(value: string) {
    const trimmed = value.trim();
    const match = trimmed.match(/^(.*)<([^>]+)>$/);
    if (match) {
      return { name: match[1].trim(), email: match[2].trim() };
    }
    return { email: trimmed };
  }

  private normalizeRecipients(to: string | string[]) {
    const list = Array.isArray(to) ? to : to.split(",");
    return list
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => this.parseEmailAddress(item));
  }

  private flattenRecipients(to: string | string[]) {
    const list = Array.isArray(to) ? to : to.split(",");
    return list.map((item) => item.trim()).filter(Boolean);
  }

  private async sendWithMailgun(data: MailPayload) {
    const domain = process.env.MAILGUN_DOMAIN;
    const apiKey = process.env.MAILGUN_API_KEY;
    if (!domain || !apiKey) {
      throw new Error("Mailgun is enabled but MAILGUN_DOMAIN/API_KEY is missing");
    }

    const form = new FormData();
    form.append("from", this.getMailgunFrom());
    form.append("to", this.normalizeTo(data.to));
    form.append("subject", data.subject);
    form.append(
      "text",
      data.text || `${process.env.NAME || "Alaba Marketplace"} notification`,
    );
    if (data.html) form.append("html", data.html);

    if (data.attachments?.length) {
      for (const attachment of data.attachments) {
        form.append("attachment", attachment.content, {
          filename: attachment.filename,
          contentType: attachment.contentType,
        });
      }
    }

    const url = `${this.getMailgunBaseUrl()}/v3/${domain}/messages`;
    await axios.post(url, form, {
      auth: { username: "api", password: apiKey },
      headers: form.getHeaders(),
      timeout: 20000,
    });
  }

  private async sendWithMailtrapApi(data: MailPayload) {
    const from = this.parseEmailAddress(this.getMailtrapApiFrom());
    const to = this.normalizeRecipients(data.to);

    const payload: any = {
      from,
      to,
      subject: data.subject,
      ...(data.text ? { text: data.text } : {}),
      ...(data.html ? { html: data.html } : {}),
    };

    if (data.attachments?.length) {
      payload.attachments = data.attachments.map((att) => ({
        filename: att.filename,
        type: att.contentType,
        disposition: "attachment",
        content:
          typeof att.content === "string"
            ? att.content
            : Buffer.from(att.content).toString("base64"),
      }));
    }

    const client = this.getMailtrapClient();
    await client.send(payload);
  }

  private async sendWithProvider(provider: MailProvider, data: MailPayload) {
    if (provider === "mailgun") {
      return this.sendWithMailgun(data);
    }

    if (provider === "mailtrap_api") {
      return this.sendWithMailtrapApi(data);
    }

    return this.mailerService.sendMail({
      to: data.to,
      subject: data.subject,
      text: data.text,
      html: data.html,
      attachments: data.attachments,
    });
  }

  private async sendMail(data: MailPayload) {
    const primary = this.getConfiguredProvider();

    try {
      return await this.sendWithProvider(primary, data);
    } catch (primaryError) {
      const fallbacks = this.getFallbackProviders(primary);

      if (!this.isRetryableProviderError(primaryError) || fallbacks.length === 0) {
        throw primaryError;
      }

      this.logger.warn(
        `Mail provider ${primary} failed. Attempting fallback providers.`,
      );
      this.logger.warn(
        JSON.stringify({
          error: primaryError?.message || primaryError,
          fallbacks,
        }),
      );

      let lastError = primaryError;

      for (const provider of fallbacks) {
        try {
          return await this.sendWithProvider(provider, data);
        } catch (fallbackError) {
          lastError = fallbackError;
          this.logger.error(
            `Mail fallback ${provider} FAILED: ${
              fallbackError?.message || fallbackError
            }`,
            fallbackError?.stack,
          );
        }
      }

      throw lastError;
    }
  }

  private mailtrapClient: MailtrapClient | null = null;

  private getMailtrapClient(): MailtrapClient {
    if (this.mailtrapClient) return this.mailtrapClient;
    const token = process.env.MAILTRAP_API_TOKEN;

    if (!token) {
      throw new Error(
        "Mailtrap API is enabled but MAILTRAP_API_TOKEN is missing",
      );
    }
    this.mailtrapClient = new MailtrapClient({ token });
    return this.mailtrapClient;
  }

  async AuthMail(data: any) {
    try {
      this.logger.log(`Sending AuthMail to: ${data?.to}`);
      await this.sendMail({
        to: data?.to,
        subject: data?.subject,
        text: `${process.env.NAME} notification`,
        html: data?.template,
      });
      this.logger.log(`AuthMail sent to: ${data?.to}`);
    } catch (err) {
      this.logger.error(
        `AuthMail FAILED for ${data?.to}: ${err?.message || err}`,
        err?.stack,
      );
    }
  }

  async InviteUserMail(data: any) {
    try {
      await this.sendMail({
        to: data?.to,
        subject: data?.subject,
        text: `${process.env.NAME} notification`,
      });
    } catch (err) {
      this.logger.error(
        `InviteUserMail FAILED for ${data?.to}: ${err?.message || err}`,
        err?.stack,
      );
    }
  }
  async RequestDocumentMail(data: any) {
    try {
      this.logger.log(`Sending RequestDocumentMail to: ${data?.to}`);
      await this.sendMail({
        to: data?.to,
        subject: data?.subject,
        text: `${process.env.NAME} notification`,
        html: data?.template,
      });
      this.logger.log(`RequestDocumentMail sent to: ${data?.to}`);
    } catch (err) {
      this.logger.error(
        `RequestDocumentMail FAILED for ${data?.to}: ${err?.message || err}`,
        err?.stack,
      );
    }
  }
  async updateEmailNotify(data: any) {
    try {
      this.logger.log(`Sending updateEmailNotify to: ${data?.to}`);
      await this.sendMail({
        to: data?.to,
        subject: data?.subject,
        html: data.template,
      });
      this.logger.log(`updateEmailNotify sent to: ${data?.to}`);
    } catch (err) {
      this.logger.error(
        `updateEmailNotify FAILED for ${data?.to}: ${err?.message || err}`,
        err?.stack,
      );
    }
  }

  async sellerEmails(data: any) {
    try {
      this.logger.log(`Sending sellerEmails to: ${data?.to}`);
      await this.sendMail({
        to: data?.to,
        subject: data?.subject,
        html: data.template,
      });
      this.logger.log(`sellerEmails sent to: ${data?.to}`);
    } catch (err) {
      this.logger.error(
        `sellerEmails FAILED for ${data?.to}: ${err?.message || err}`,
        err?.stack,
      );
    }
  }
  async sendInvoiceMail(data: any, pdftem, inovice_id: string) {
    try {
      this.logger.log(`Sending sendInvoiceMail to: ${data?.to}`);
      let pdf: any = await this.pdfService.PdfGen(pdftem);
      await this.sendMail({
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
      this.logger.log(`sendInvoiceMail sent to: ${data?.to}`);
    } catch (err) {
      this.logger.error(
        `sendInvoiceMail FAILED for ${data?.to}: ${err?.message || err}`,
        err?.stack,
      );
    }
  }

  async sendEnquiryNotification(data: any) {
    await this.queueEnquiryNotification(data);
  }

  async queueEnquiryNotification(data: any) {
    const recipients = this.flattenRecipients(data?.to || []);

    if (recipients.length === 0) {
      this.logger.warn("Enquiry notification skipped: no recipients configured");
      return;
    }

    await this.enquiryMailQueue.addBulk(
      recipients.map((recipient) => ({
        name: ENQUIRY_MAIL_JOB,
        data: {
          to: recipient,
          subject: data?.subject || "New Enquiry",
          template: data?.template,
        },
      })),
    );

    this.logger.log(
      `Queued enquiry notifications for recipients: ${recipients.length}`,
    );
  }

  async deliverEnquiryNotification(data: EnquiryMailJobData) {
    this.logger.log(`Sending Enquiry notification to: ${data.to}`);
    await this.sendMail({
      to: data.to,
      subject: data.subject || "New Enquiry",
      text: `${process.env.NAME} notification`,
      html: data.template,
    });
    this.logger.log(`Enquiry notification sent to: ${data.to}`);
  }
}
