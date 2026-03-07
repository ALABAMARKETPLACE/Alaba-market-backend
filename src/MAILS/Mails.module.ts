import { BullModule } from "@nestjs/bull";
import { MailerModule } from "@nestjs-modules/mailer";
import { Global, Logger, Module } from "@nestjs/common";
import { MailService } from "./Mails.services";
import { EnquiryMailProcessor } from "./enquiry-mail.processor";
import { ENQUIRY_MAIL_QUEUE } from "./mail-queue.constants";
import { PdfService } from "./pdf.services";
import { SafeTransportFactoryProvider } from "./safe-transport.factory";

const logger = new Logger("EmailModule");

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
    logger.warn(
      `Missing SMTP credentials. Mail sending will fail. ${JSON.stringify({
        host: !!host,
        user: !!user,
        pass: !!pass,
      })}`,
    );
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

const buildBullOptions = async () => {
  const redisUrl = process.env.REDIS_URL?.trim();

  if (redisUrl) {
    return {
      redis: redisUrl,
      prefix: process.env.BULL_PREFIX || "alaba-market-backend",
    };
  }

  return {
    redis: {
      username: process.env.REDIS_USERNAME || undefined,
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: Number(process.env.REDIS_PORT || 6379),
      password: process.env.REDIS_PASSWORD || undefined,
      db: Number(process.env.REDIS_DB || 0),
    },
    prefix: process.env.BULL_PREFIX || "alaba-market-backend",
  };
};

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: async () => buildBullOptions(),
    }),
    BullModule.registerQueue({
      name: ENQUIRY_MAIL_QUEUE,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
        removeOnComplete: 100,
        removeOnFail: 200,
      },
    }),
    MailerModule.forRootAsync({
      useFactory: async () => buildMailerOptions(),
      extraProviders: [SafeTransportFactoryProvider],
    }),
  ],
  providers: [MailService, PdfService, EnquiryMailProcessor],
  exports: [MailService, PdfService],
})
export class EmailModule {}
