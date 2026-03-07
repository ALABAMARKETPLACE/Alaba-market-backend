import { MailerModule } from "@nestjs-modules/mailer";
import { Global, Module } from "@nestjs/common";
import { MailService } from "./Mails.services";
import { PdfService } from "./pdf.services";
import { SafeTransportFactoryProvider } from "./safe-transport.factory";

const buildMailerOptions = async () => {
  const provider = process.env.MAIL_PROVIDER?.toLowerCase() || "smtp";
  const useMailgun = provider === "mailgun";
  const useMailtrap = provider === "mailtrap";

  if (useMailgun) {
    return {
      transport: {
        jsonTransport: true,
      },
      defaults: {
        from:
          process.env.MAILGUN_FROM ||
          process.env.MAILER_DEFAULT_FROM ||
          process.env.MAILER_USER,
      },
    };
  }

  const host = useMailtrap
    ? process.env.MAILTRAP_HOST || process.env.MAILER_HOST
    : process.env.MAILER_HOST;
  const port = useMailtrap
    ? Number(process.env.MAILTRAP_PORT || process.env.MAILER_PORT || 587)
    : process.env.MAILER_PORT
      ? Number(process.env.MAILER_PORT)
      : 587;
  const user = useMailtrap
    ? process.env.MAILTRAP_USER || process.env.MAILER_USER
    : process.env.MAILER_USER;
  const pass = useMailtrap
    ? process.env.MAILTRAP_PASSWORD || process.env.MAILER_PASSWORD
    : process.env.MAILER_PASSWORD;

  if (!host || !user || !pass) {
    console.warn("Missing SMTP credentials. Mail sending will fail.", {
      host: !!host,
      user: !!user,
      pass: !!pass,
    });
  }

  return {
    transport: {
      host,
      port,
      secure:
        (useMailtrap
          ? process.env.MAILTRAP_SECURE === "true"
          : process.env.MAILER_SECURE === "true") || port === 465,
      auth: { user, pass },
    },
    defaults: {
      from:
        (useMailtrap
          ? process.env.MAILTRAP_FROM || process.env.MAILER_DEFAULT_FROM
          : process.env.MAILER_DEFAULT_FROM) || user,
    },
  };
};

@Global()
@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: async () => buildMailerOptions(),
      extraProviders: [SafeTransportFactoryProvider],
    }),
  ],
  providers: [MailService, PdfService],
  exports: [MailService, PdfService],
})
export class EmailModule {}
