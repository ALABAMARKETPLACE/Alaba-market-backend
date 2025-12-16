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
          secure: false,
          auth: {
            user: process.env.MAILER_USER,
            pass: process.env.MAILER_PASSWORD,
          },
        },
        defaults: {
          from: process.env.MAILER_USER,
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
