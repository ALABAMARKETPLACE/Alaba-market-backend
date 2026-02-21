import { MailerService } from "@nestjs-modules/mailer";
import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { PdfService } from "./pdf.services";

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private emailEnabled = true;

  constructor(
    private mailerService: MailerService,
    private pdfService: PdfService,
  ) {}

  /**
   * Test email connection when the module initializes
   */
  async onModuleInit() {
    try {
      // Get the transporter (internal mail service)
      const transporter = this.mailerService["transporter"];

      if (transporter && transporter.verify) {
        // Verify SMTP connection
        await transporter.verify();
        this.logger.log("Email service connected successfully");
        this.logger.log(
          `SMTP Host: ${
            process.env.BREVO_SMTP_HOST || process.env.MAIL_HOST
          }`,
        );
        this.emailEnabled = true;
      } else {
        this.logger.warn(
          "Email transporter not available - emails will be disabled",
        );
        this.emailEnabled = false;
      }
    } catch (error) {
      this.logger.error("❌ Email service connection failed:", error.message);
      this.logger.warn(
        "Emails will be disabled. App will continue without email functionality.",
      );
      this.emailEnabled = false;
      // Don't throw - let app start even if email fails
    }
  }

  /**
   * Internal method to safely send emails with error handling
   */
  private async sendEmail(mailOptions: any, emailType: string = "Email") {
    if (!this.emailEnabled) {
      this.logger.warn(`${emailType} not sent - email service is disabled`);
      return false;
    }

    try {
      await this.mailerService.sendMail({
        ...mailOptions,
        text:
          mailOptions.text ||
          `${process.env.NAME || "Alaba Marketplace"} notification`,
      });

      this.logger.log(
        `${emailType} sent successfully to: ${mailOptions.to}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send ${emailType} to ${mailOptions.to}:`,
        error.message,
      );

      // Log full error in development
      if (process.env.NODE_ENV === "development") {
        this.logger.error("Full error:", error);
      }

      return false;
    }
  }

  async AuthMail(data: any) {
    return this.sendEmail(
      {
        to: data?.to,
        subject: data?.subject,
        html: data?.template,
      },
      "Authentication Email",
    );
  }

  async InviteUserMail(data: any) {
    return this.sendEmail(
      {
        to: data?.to,
        subject: data?.subject,
        html: data?.template,
      },
      "Invitation Email",
    );
  }

  async RequestDocumentMail(data: any) {
    return this.sendEmail(
      {
        to: data?.to,
        subject: data?.subject,
        html: data?.template,
      },
      "Document Request Email",
    );
  }

  async updateEmailNotify(data: any) {
    return this.sendEmail(
      {
        to: data?.to,
        subject: data?.subject,
        html: data?.template,
      },
      "Update Notification Email",
    );
  }

  async sellerEmails(data: any) {
    return this.sendEmail(
      {
        to: data?.to,
        subject: data?.subject,
        html: data?.template,
      },
      "Seller Email",
    );
  }

  async sendInvoiceMail(data: any, pdftem: any, invoice_id: string) {
    if (!this.emailEnabled) {
      this.logger.warn(
        `Invoice email not sent - email service is disabled`,
      );
      return false;
    }

    try {
      // Generate PDF
      const pdf: any = await this.pdfService.PdfGen(pdftem);

      if (!pdf || !pdf.data) {
        throw new Error("Failed to generate PDF");
      }

      // Send email with attachment
      await this.mailerService.sendMail({
        to: data?.to,
        subject: data?.subject || `Invoice ${invoice_id}`,
        text: `${process.env.NAME || "Alaba Marketplace"} Notification`,
        html: data?.template,
        attachments: [
          {
            filename: `${invoice_id}.pdf`,
            content: Buffer.from(pdf.data, "base64"),
            contentType: "application/pdf",
          },
        ],
      });

      this.logger.log(`Invoice email sent successfully to: ${data?.to}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send invoice email to ${data?.to}:`,
        error.message,
      );

      if (process.env.NODE_ENV === "development") {
        this.logger.error("Full error:", error);
      }

      return false;
    }
  }

  /**
   * Manual test method - can be used via a controller endpoint
   */
  async testEmailConnection(testEmail: string = "test@example.com") {
    try {
      await this.sendEmail(
        {
          to: testEmail,
          subject: "Test Email - Alaba Marketplace",
          html: "<h1>Test Email</h1><p>If you receive this, your email service is working correctly!</p>",
        },
        "Test Email",
      );
      return { success: true, message: "Test email sent successfully" };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}
