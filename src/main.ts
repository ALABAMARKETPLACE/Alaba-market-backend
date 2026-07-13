import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { setupSwagger } from "./swagger";
import * as dotenv from "dotenv";
import * as bodyParser from "body-parser";
import helmet from "helmet";
import { AllExceptionsFilter } from "./shared/filters/all-exceptions.filter";
import { validateEnvironment } from "./config/env.validation";
import { Logger as PinoNestLogger } from "nestjs-pino";
import { createBootstrapLogger } from "./shared/logger/pino.config";

// ✅ Load .env FIRST (before anything else)
dotenv.config();

const bootstrapLogger = createBootstrapLogger();

process.on("unhandledRejection", (reason: any) => {
  bootstrapLogger.error(
    { err: reason instanceof Error ? reason : new Error(String(reason)) },
    "unhandled promise rejection",
  );
});

process.on("uncaughtException", (error) => {
  bootstrapLogger.fatal({ err: error }, "uncaught exception");
});

process.on("warning", (warning) => {
  bootstrapLogger.warn(
    {
      module: "Process",
      event: "process_warning",
      warningName: warning.name,
      warningMessage: warning.message,
      warningStack: warning.stack,
    },
    "process warning",
  );
});

async function bootstrap() {
  // ================= ENV VALIDATION =================
  const envValidation = validateEnvironment();
  const NODE_ENV = process.env.NODE_ENV || "development";
  const PORT = parseInt(process.env.PORT, 10) || 8000;

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  const logger = app.get(PinoNestLogger);
  app.useLogger(logger);
  app.flushLogs();

  app.use(
    helmet({
      contentSecurityPolicy: NODE_ENV === "production" ? undefined : false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  envValidation.warnings.forEach((warning) => logger.warn(warning));

  const httpAdapter = app.getHttpAdapter();
  const expressApp = httpAdapter.getInstance();

  if (typeof expressApp?.set === "function") {
    expressApp.set("etag", false);
  }

  app.use((req: any, res: any, next: () => void) => {
    const cacheControl =
      "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, private";
    res.setHeader("Cache-Control", cacheControl);
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");
    res.setHeader("X-Accel-Expires", "0");
    res.setHeader("X-Cache", "no-store");
    if (res.removeHeader) {
      res.removeHeader("ETag");
    }
    next();
  });

  const captureRawBody = (req: any, _res: any, buf: Buffer) => {
    if (buf?.length) {
      req.rawBody = Buffer.from(buf);
    }
  };

  // ================= GLOBAL FILTERS =================
  app.useGlobalFilters(new AllExceptionsFilter());
  // ==================================================

  // ================= GLOBAL PIPES ===================
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: false,
      forbidNonWhitelisted: false,
    }),
  );
  // ==================================================

  // /================= BODY LIMITS ====================
  app.use(bodyParser.json({ limit: "50mb", verify: captureRawBody }));
  app.use(
    bodyParser.urlencoded({
      limit: "50mb",
      extended: true,
      verify: captureRawBody,
    }),
  );
  // ==================================================

  // ================= CORS ===========================
  const allowedOrigins = [
    "https://dev.alabamarketplace.ng",
    "https://alabamarketplace.ng",
    "https://development.alabamarketplace.ng",
    "https://prod-front.alabamarketplace.ng",
    "dev.alabamarketplace.ng",
  ];

  // ✅ Add localhost for development
  if (NODE_ENV === "development") {
    allowedOrigins.push("http://localhost:3000");
    allowedOrigins.push("http://localhost:3001");
    allowedOrigins.push("http://localhost:5173"); // Vite default
  }

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (
        allowedOrigins.includes(origin) ||
        /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)
      ) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "x-access-token",
      "X-Request-Id",
      "X-Correlation-Id",
    ],
    exposedHeaders: ["Content-Disposition", "X-Request-Id"],
  });
  // ==================================================

  // ================= SWAGGER ========================
  // ✅ Only enable Swagger in development/staging
  if (NODE_ENV !== "production") {
    setupSwagger(app);
    logger.log(
      { module: "Bootstrap", port: PORT },
      "Swagger documentation enabled",
    );
  }
  // ==================================================

  // ================= GRACEFUL SHUTDOWN ==============
  // ✅ Handle PM2 shutdown signals
  process.on("SIGTERM", async () => {
    logger.log({ module: "Bootstrap", signal: "SIGTERM" }, "shutdown started");
    await app.close();
    process.exit(0);
  });

  process.on("SIGINT", async () => {
    logger.log({ module: "Bootstrap", signal: "SIGINT" }, "shutdown started");
    await app.close();
    process.exit(0);
  });
  // ==================================================

  await app.listen(PORT, "0.0.0.0");
  logger.log(
    {
      module: "Bootstrap",
      port: PORT,
      environment: NODE_ENV,
      databaseHost: process.env.DATABASE_HOST,
    },
    "application started",
  );
}

bootstrap().catch((error) => {
  bootstrapLogger.fatal({ err: error }, "application bootstrap failed");
  process.exitCode = 1;
});
