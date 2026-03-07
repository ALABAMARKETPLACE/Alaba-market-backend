import { Inject, Injectable } from "@nestjs/common";
import { createTransport, Transporter } from "nodemailer";
import {
  MAILER_OPTIONS,
  MAILER_TRANSPORT_FACTORY,
} from "@nestjs-modules/mailer/dist/constants/mailer.constant";

@Injectable()
export class SafeMailerTransportFactory {
  constructor(@Inject(MAILER_OPTIONS) private readonly options: any) {}

  createTransport(opts?: any): Transporter {
    const transporter: any = createTransport(
      opts || this.options.transport,
      this.options.defaults,
    );

    const originalVerify = transporter.verify?.bind(transporter);
    transporter.verify = (...args: any[]) => {
      try {
        if (typeof originalVerify === "function") {
          const result = originalVerify(...args);
          if (result && typeof result.then === "function") {
            return result;
          }
          // If a callback was provided, let nodemailer handle it.
          if (args.length > 0 && typeof args[0] === "function") {
            return result;
          }
        }
        return Promise.resolve(true);
      } catch (err) {
        return Promise.reject(err);
      }
    };

    return transporter;
  }
}

export const SafeTransportFactoryProvider = {
  provide: MAILER_TRANSPORT_FACTORY,
  useClass: SafeMailerTransportFactory,
};
