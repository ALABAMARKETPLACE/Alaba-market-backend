import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { Logger, ValidationPipe } from "@nestjs/common";
import { setupSwagger } from "./swagger";
import * as dotenv from "dotenv";
import * as bodyParser from "body-parser";
import { AllExceptionsFilter } from "./shared/filters/all-exceptions.filter";

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

  console.log("📋 Environment:", NODE_ENV);
  console.log("🗄️  Database:", process.env.DATABASE_HOST);
  console.log("🌐 Port:", PORT);
  // ==================================================

  const app = await NestFactory.create(AppModule, {
    logger: ["error", "warn", "log", "debug", "verbose"],
  });

  const logger = new Logger("NestApplication");

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

  // ================= BODY LIMITS ====================
  app.use(bodyParser.json({ limit: "50mb" }));
  app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
  // ==================================================

  // ================= CORS ===========================
  const allowedOrigins = [
    "https://dev.alabamarketplace.ng/",
    "https://alabamarketplace.ng",
    "https://development.alabamarketplace.ng",
  ];

  // ✅ Add localhost for development
  if (NODE_ENV === "development") {
    allowedOrigins.push("http://localhost:3000");
    allowedOrigins.push("http://localhost:3001");
    allowedOrigins.push("http://localhost:5173"); // Vite default
  }

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Content-Disposition"],
  });
  // ==================================================

  // ================= REQUEST LOGGER =================
  // ✅ Only log in development or if explicitly enabled
  if (NODE_ENV === "development" || process.env.LOG_REQUESTS === "true") {
    app.use((req: any, res: any, next: any) => {
      const startTime = Date.now();

      logger.log(`→ ${req.method} ${req.originalUrl}`);

      res.on("finish", () => {
        const duration = Date.now() - startTime;
        const statusEmoji = res.statusCode < 400 ? "✅" : "❌";
        logger.log(
          `${statusEmoji} ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`,
        );
      });

      next();
    });
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
