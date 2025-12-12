import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.modules';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  // Log database configuration for debugging
  console.log('Database Configuration:');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
  console.log('DB_HOST:', process.env.DB_HOST || 'NOT SET');
  console.log('DB_PORT:', process.env.DB_PORT || 'NOT SET');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  
  const app = await NestFactory.create(AppModule);

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Serve static files (uploads)
  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('Alaba Marketplace Delivery System API')
    .setDescription('Complete API documentation for Alaba Marketplace delivery and payment system')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Users', 'User management')
    .addTag('Products', 'Product management')
    .addTag('Orders', 'Order management')
    .addTag('Delivery Company', 'Delivery company operations')
    .addTag('Drivers', 'Driver management')
    .addTag('Tracking', 'Order tracking and logs')
    .addTag('Paystack', 'Payment processing')
    .addTag('Subscription', 'Subscription management')
    .addTag('Webhooks', 'Payment webhooks')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT || 3002;
  await app.listen(port, '0.0.0.0'); // Listen on all network interfaces

  console.log(`
  🚀 Application is running on: http://localhost:${port}
  📚 Swagger documentation: http://localhost:${port}/api/docs
  🌍 Environment: ${process.env.NODE_ENV}
  `);
}

bootstrap();
