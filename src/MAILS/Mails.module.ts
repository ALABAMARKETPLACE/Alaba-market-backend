import { MailerModule } from "@nestjs-modules/mailer";
import { Global, Module } from "@nestjs/common";
import { MailService } from "./Mails.services";
import { PdfService } from "./pdf.services";
import { SettingsModule } from "../SETTINGS/settings.module";
@Global()
@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: async () => ({
        transport: {
          host: process.env.MAILER_HOST,
          port: process.env.MAILER_PORT ? Number(process.env.MAILER_PORT) : 587,
          secure:
            process.env.MAILER_SECURE === "true" ||
            (process.env.MAILER_PORT &&
              Number(process.env.MAILER_PORT) === 465),
          auth: {
            user: process.env.MAILER_USER,
            pass: process.env.MAILER_PASSWORD,
          },
        },
        defaults: {
          // default sender address
          from: process.env.MAILER_DEFAULT_FROM || process.env.MAILER_USER,
        },
        template: {
          options: {
            strict: true,
          },
        },
      }),
    }),
    SettingsModule,
  ],
  providers: [MailService, PdfService],
  exports: [MailService, PdfService],
})
export class EmailModule {}
