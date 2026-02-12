import { MailerModule } from "@nestjs-modules/mailer";
import { Global, Module } from "@nestjs/common";
import { MailService } from "./Mails.services";
import { PdfService } from "./pdf.services";
import { SettingsModule } from "../SETTINGS/settings.module";

@Global()
@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: async () => {
        const isDevelopment = process.env.NODE_ENV === "development";
        const enableEmails = process.env.ENABLE_EMAILS === "true";

        // ✅ Use a mock SMTP server in development (doesn't actually send)
        if (isDevelopment && !enableEmails) {
          console.log(
            "📧 Email service in development mode - emails will be logged only",
          );
          return {
            transport: {
              host: "localhost",
              port: 1025, // Mock SMTP port (won't actually connect)
              secure: false,
              ignoreTLS: true,
              auth: {
                user: "dev@localhost",
                pass: "dev",
              },
            },
            defaults: {
              from: process.env.MAILER_DEFAULT_FROM || "noreply@example.com",
            },
            template: {
              options: {
                strict: true,
              },
            },
            // ✅ Disable verification in development
            preview: false,
            verifyTransporters: false,
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
            // ✅ Add connection pooling
            pool: true,
            maxConnections: 5,
            maxMessages: 100,
            rateDelta: 1000,
            rateLimit: 5,
            // ✅ More lenient TLS for development
            tls: isDevelopment
              ? {
                  rejectUnauthorized: false,
                  ciphers: "SSLv3",
                }
              : undefined,
          },
          defaults: {
            from: process.env.MAILER_DEFAULT_FROM || process.env.MAILER_USER,
          },
          template: {
            options: {
              strict: true,
            },
          },
          // ✅ Only verify in production
          preview: false,
          verifyTransporters: !isDevelopment,
        };
      },
    }),
    SettingsModule,
  ],
  providers: [MailService, PdfService],
  exports: [MailService, PdfService],
})
export class EmailModule {}
