import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { setupSwagger } from './swagger';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as bodyParser from 'body-parser';
import { AllExceptionsFilter } from './shared/filters/all-exceptions.filter';

// Catch crashes OUTSIDE Nest (very important for PM2) w
process.on('unhandledRejection', (reason: any) => {
  console.error('UNHANDLED REJECTION:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('UNCAUGHT EXCEPTION:', error);
});

async function bootstrap() {
  // ================= ENV CONFIG =================
  const NODE_ENV = process.env.NODE_ENV || 'development';
  const envPath = path.resolve(__dirname, '..', `.env.${NODE_ENV}`);
  dotenv.config({ path: envPath });
  // =============================================

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const logger = new Logger(process.env.NAME || 'NestApp');

  // ================= GLOBAL FILTERS =================
  app.useGlobalFilters(new AllExceptionsFilter());
  // ==================================================

  // ================= GLOBAL PIPES ===================
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      // Allow extra properties (e.g., nested image objects) to pass through
      whitelist: false,
      forbidNonWhitelisted: false,
    }),
  );
  // ==================================================

  // ================= BODY LIMITS ====================
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
  // ==================================================

  // ================= CORS ===========================
  app.enableCors({
    origin: [
      'https://alabamarketplace.ng',
      'https://development.alabamarketplace.ng',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Disposition'],
  });
  // ==================================================

  // ================= REQUEST LOGGER =================
  app.use((req: any, res: any, next: any) => {
    console.log('\n=== INCOMING REQUEST ===');
    console.log(`Method: ${req.method}`);
    console.log(`URL: ${req.originalUrl}`);
    console.log(`Origin: ${req.headers.origin}`);
    console.log(`User-Agent: ${req.headers['user-agent']}`);
    console.log(`Content-Type: ${req.headers['content-type']}`);
    console.log(
      `Authorization: ${req.headers.authorization ? 'Present' : 'Not present'}`,
    );

    res.on('finish', () => {
      console.log(`Response Status: ${res.statusCode}`);
      console.log('=== REQUEST COMPLETE ===\n');
    });

    next();
  });
  // ==================================================

  // ================= SWAGGER ========================
  setupSwagger(app);
  // ==================================================

  const PORT = Number(process.env.PORT) || 8000;

  await app.listen(PORT, '0.0.0.0', () => {
    logger.log(
      `Server running on port ${PORT} | ENV: ${NODE_ENV}`,
    );
  });
}

bootstrap();
