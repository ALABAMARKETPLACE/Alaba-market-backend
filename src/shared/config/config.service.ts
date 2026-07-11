import { createStructuredLogger } from "../logger/structured-logger";
import { Injectable } from "@nestjs/common";
import { Dialect } from "sequelize";

const appLog = createStructuredLogger("config_service");

@Injectable()
export class ConfigService {
  get sequelizeOrmConfig() {
    appLog.info("DATABASE_SSL =", process.env.DATABASE_SSL);
    appLog.info("DATABASE_HOST =", process.env.DATABASE_HOST);

    return {
      // dialect: process.env.DATABASE as Dialect,
      dialect: "postgres" as Dialect,
      host: process.env.DATABASE_HOST,
      port: +process.env.DATABASE_PORT,
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_DATABASE,

      synchronize: false,

      logging: false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
      dialectOptions:
        process.env.DATABASE_SSL === "true"
          ? {
              ssl: {
                require: true,
                rejectUnauthorized: false,
              },
            }
          : {},
    };
  }
  get firebaseConfig() {
    return {
      type: process.env.FIREBASE_TYPE,
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: process.env.FIREBASE_AUTH_URI,
      token_uri: process.env.FIREBASE_TOKEN_URI,
      auth_provider_x509_cert_url:
        process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
      client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
      universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN,
    };
  }

  get pushNotificationConfig() {
    return {
      type: process.env.PUSH_NOTIFICATION_TYPE,
      project_id: process.env.PUSH_NOTIFICATION_PROJECT_ID,
      private_key_id: process.env.PUSH_NOTIFICATION_PRIVATE_KEY_ID,
      private_key: process.env.PUSH_NOTIFICATION_PRIVATE_KEY,
      client_email: process.env.PUSH_NOTIFICATION_CLIENT_EMAIL,
      client_id: process.env.PUSH_NOTIFICATION_CLIENT_ID,
      auth_uri: process.env.PUSH_NOTIFICATION_AUTH_URI,
      token_uri: process.env.PUSH_NOTIFICATION_TOKEN_URI,
      auth_provider_x509_cert_url:
        process.env.PUSH_NOTIFICATION_AUTH_PROVIDER_X509_CERT_URL,
      client_x509_cert_url: process.env.PUSH_NOTIFICATION_CLIENT_X509_CERT_URL,
      universe_domain: process.env.PUSH_NOTIFICATION_UNIVERSE_DOMAIN,
    };
  }
}
