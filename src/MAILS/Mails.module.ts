import { MailerModule } from "@nestjs-modules/mailer";
import { Global, Module } from "@nestjs/common";
import { MailService } from "./Mails.services";
import { PdfService } from "./pdf.services";
import { SettingsModule } from "../SETTINGS/settings.module";
import * as nodemailer from "nodemailer";

@Global()
@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: async () => {
        const isDevelopment = process.env.NODE_ENV === "development";
        const enableEmails = process.env.ENABLE_EMAILS === "true";

        // ✅ In development, create a test account that doesn't require connection
        if (isDevelopment && !enableEmails) {
          console.log(
            "📧 Email service in development mode - emails will not be sent",
          );

          // Create ethereal test account (fake SMTP)
          const testAccount = await nodemailer.createTestAccount();

          return {
            transport: {
              host: "smtp.ethereal.email",
              port: 587,
              secure: false,
              auth: {
                user: testAccount.user,
                pass: testAccount.pass,
              },
            },
            defaults: {
              from: process.env.MAILER_DEFAULT_FROM || "noreply@example.com",
            },
          };
        }

        // ✅ Production or explicitly enabled email config
        console.log(
          "📧 Email service configured for:",
          process.env.MAILER_HOST,
        );
        return {
          transport: {
            host: process.env.MAILER_HOST,
            port: process.env.MAILER_PORT
              ? Number(process.env.MAILER_PORT)
              : 587,
            secure:
              process.env.MAILER_SECURE === "true" ||
              (process.env.MAILER_PORT &&
                Number(process.env.MAILER_PORT) === 465),
            auth: {
              user: process.env.MAILER_USER,
              pass: process.env.MAILER_PASSWORD,
            },
            pool: true,
            maxConnections: 5,
            maxMessages: 100,
            rateDelta: 1000,
            rateLimit: 5,
          },
          defaults: {
            from: process.env.MAILER_DEFAULT_FROM || process.env.MAILER_USER,
          },
        };
      },
    }),
    SettingsModule,
  ],
  providers: [MailService, PdfService],
  exports: [MailService, PdfService],
})
export class EmailModule {}
