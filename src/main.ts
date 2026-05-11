import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { setupSwagger } from "./swagger";
import * as dotenv from "dotenv";
import * as bodyParser from "body-parser";
import { AllExceptionsFilter } from "./shared/filters/all-exceptions.filter";
import * as path from "path";
import { FileLogger, patchConsole } from "./shared/logger/file-logger";
import { createRequestLogger } from "./shared/logger/request-logger";

// ✅ Load .env FIRST (before anything else)
dotenv.config();

// Catch crashes OUTSIDE Nest (very important for PM2)
process.on("unhandledRejection", (reason: any) => {
  console.error("❌ UNHANDLED REJECTION:", reason);
  // Don't exit in production - let PM2 handle it
});

process.on("uncaughtException", (error) => {
  console.error("❌ UNCAUGHT EXCEPTION:", error);
  // Don't exit in production - let PM2 handle it
});

async function bootstrap() {
  // ================= ENV VALIDATION =================
  const NODE_ENV = process.env.NODE_ENV || "development";
  const PORT = parseInt(process.env.PORT, 10) || 8000;
  const LOG_FILE_PATH =
    process.env.LOG_FILE_PATH ||
    path.join(process.cwd(), "logs", "app.log");
  const LOG_ERROR_FILE_PATH =
    process.env.LOG_ERROR_FILE_PATH ||
    path.join(process.cwd(), "logs", "error.log");
  const LOG_WARN_FILE_PATH =
    process.env.LOG_WARN_FILE_PATH ||
    path.join(process.cwd(), "logs", "warn.log");
  const LOG_ROTATE_DAILY = process.env.LOG_ROTATE_DAILY !== "false";
  const LOG_REQUESTS = process.env.LOG_REQUESTS !== "false";
  const LOG_REQUEST_BODIES = process.env.LOG_REQUEST_BODIES !== "false";
  const LOG_REQUEST_HEADERS = process.env.LOG_REQUEST_HEADERS === "true";

  const originalConsole = {
    log: console.log.bind(console),
    error: console.error.bind(console),
    warn: console.warn.bind(console),
    debug: console.debug.bind(console),
    info: console.info.bind(console),
  };

  const fileLogger = new FileLogger({
    logFilePath: LOG_FILE_PATH,
    errorLogFilePath: LOG_ERROR_FILE_PATH,
    warnLogFilePath: LOG_WARN_FILE_PATH,
    appName: "NestApplication",
    mirrorToConsole: true,
    consoleMethods: originalConsole,
    rotateDaily: LOG_ROTATE_DAILY,
  });

  patchConsole(fileLogger, { forwardToConsole: false });

  console.log("📋 Environment:", NODE_ENV);
  console.log("🗄️  Database:", process.env.DATABASE_HOST);
  console.log("🌐 Port:", PORT);
  // ==================================================

  const app = await NestFactory.create(AppModule, {
    logger: fileLogger,
  });

  const logger = fileLogger;
  app.useLogger(fileLogger);

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
    ],
    exposedHeaders: ["Content-Disposition"],
  });
  // ==================================================

  // ================= REQUEST LOGGER =================
  if (LOG_REQUESTS) {
    app.use(
      createRequestLogger(logger, {
        logBodies: LOG_REQUEST_BODIES,
        logHeaders: LOG_REQUEST_HEADERS,
      }),
    );
  }
  // ==================================================

  // ================= SWAGGER ========================
  // ✅ Only enable Swagger in development/staging
  if (NODE_ENV !== "production") {
    setupSwagger(app);
    logger.log(`📚 Swagger: http://localhost:${PORT}/api/docs`);
  }
  // ==================================================

  // ================= GRACEFUL SHUTDOWN ==============
  // ✅ Handle PM2 shutdown signals
  process.on("SIGTERM", async () => {
    logger.log("⚠️  SIGTERM received, shutting down gracefully...");
    await app.close();
    process.exit(0);
  });

  process.on("SIGINT", async () => {
    logger.log("⚠️  SIGINT received, shutting down gracefully...");
    await app.close();
    process.exit(0);
  });
  // ==================================================

  await app.listen(PORT, "0.0.0.0", () => {
    logger.log(`🚀 Server running on http://localhost:${PORT}`);
    logger.log(`📊 Environment: ${NODE_ENV}`);
    logger.log(`🗄️  Database: ${process.env.DATABASE_HOST}`);
    if (NODE_ENV !== "production") {
      logger.log(`📚 Swagger: http://localhost:${PORT}/api/docs`);
    }
  });
}

bootstrap();
