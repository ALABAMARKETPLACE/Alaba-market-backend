import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { ScheduleModule } from '@nestjs/schedule';
import { CacheModule } from '@nestjs/cache-manager';
import { MailerModule } from '@nestjs-modules/mailer';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { join } from 'path';

// Modules
import { AuthModule } from './common/modules/auth/auth.modules';
import { UsersModule } from './common/modules/users/users.modules';
import { ProductsModule } from './common/modules/products/product.modules';
import { OrdersModule } from './common/modules/orders/orders.module';
import { DeliveryCompanyModule } from './common/modules/delivery/devivery-company.module';
import { DriversModule } from './common/modules/drivers/drivers.module';
import { TrackingModule } from './common/modules/tracking/track.module';
import { PaystackModule } from './common/modules/paystack/paystack.module';
import { SubscriptionModule } from './common/modules/subscription/subscription.module';
import { WebhooksModule } from './common/modules/webhooks/webhooks.module';
import { UploadModule } from './common/modules/upload/upload.modules';
import { NotificationsModule } from './common/modules/notifications/notifications.module';
// import { GatewaysModule } from './gateways/gateways.module';

// Filters & Interceptors
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform-interception';

// Controllers
import { HealthController } from './health.controller';

// Entities
import { User } from './common/modules/users/entities/user-entity';
import { Product } from './common/modules/products/entities/products-entity';
import { Order } from './common/modules/orders/entities/order-entity';
import { DeliveryCompany } from './common/modules/delivery/entities/delivery-compnay-entity';
import { Driver } from './common/modules/drivers/entities/driver.entity';
import { DeliveryLog } from './common/modules/delivery/entities/delivery-log.entity';
import { Subscription } from './common/modules/subscription/entities/subscription.entity';
import { Notification } from './common/modules/notifications/entities/notification.entity';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database
    SequelizeModule.forRoot(
      process.env.DATABASE_URL
        ? {
            dialect: 'postgres',
            uri: process.env.DATABASE_URL,
            dialectOptions: {
              ssl: {
                require: true,
                rejectUnauthorized: false,
              },
            },
            models: [
              User,
              Product,
              Order,
              DeliveryCompany,
              Driver,
              DeliveryLog,
              Subscription,
              Notification,
            ],
            autoLoadModels: true,
            synchronize: true,
            logging: process.env.NODE_ENV === 'development' ? console.log : false,
          }
        : {
            dialect: 'postgres',
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT, 10) || 5432,
            username: process.env.DB_USERNAME || 'postgres',
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME || 'alaba_marketplace',
            models: [
              User,
              Product,
              Order,
              DeliveryCompany,
              Driver,
              DeliveryLog,
              Subscription,
              Notification,
            ],
            autoLoadModels: true,
            synchronize: true,
            logging: process.env.NODE_ENV === 'development' ? console.log : false,
          },
    ),

    // Caching
    CacheModule.register({
      isGlobal: true,
      ttl: 300, // 5 minutes
    }),

    // Scheduler
    ScheduleModule.forRoot(),

    // Mailer (template processing disabled to avoid native dependencies)
    MailerModule.forRoot({
      transport: {
        host: process.env.MAIL_HOST,
        port: parseInt(process.env.MAIL_PORT, 10),
        secure: false,
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASSWORD,
        },
      },
      defaults: {
        from: `"Alaba Marketplace" <${process.env.MAIL_FROM}>`,
      },
    }),

    // Feature Modules
    AuthModule,
    UsersModule,
    ProductsModule,
    OrdersModule,
    DeliveryCompanyModule,
    DriversModule,
    TrackingModule,
    PaystackModule,
    SubscriptionModule,
    WebhooksModule,
    UploadModule,
    NotificationsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}

// import { Module } from '@nestjs/common';
// import { ConfigModule } from '@nestjs/config';
// import { SequelizeModule } from '@nestjs/sequelize';
// import { ScheduleModule } from '@nestjs/schedule';
// import { CacheModule } from '@nestjs/cache-manager';
// import { MailerModule } from '@nestjs-modules/mailer';
// import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
// import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
// import { join } from 'path';

// // Modules
// import { AuthModule } from './common/modules/auth/auth.modules';
// import { UsersModule } from './common/modules/users/users.modules';
// import { ProductsModule } from './common/modules/products/product.modules';
// import { OrdersModule } from './common/modules/orders/orders.module';
// import { DeliveryCompanyModule } from './common/modules/delivery/devivery-company.module';
// import { DriversModule } from './common/modules/drivers/drivers.module';
// import { TrackingModule } from './common/modules/tracking/track.module';
// import { PaystackModule } from './common/modules/paystack/paystack.module';
// import { SubscriptionModule } from './common/modules/subscription/subscription.module';
// import { WebhooksModule } from './common/modules/webhooks/webhooks.module';
// import { UploadModule } from './common/modules/upload/upload.modules';
// // import { GatewaysModule } from './gateways/gateways.module';

// // Filters & Interceptors
// import { HttpExceptionFilter } from './common/filters/http-exception.filter';
// import { TransformInterceptor } from './common/interceptors/transform-interception';

// // Entities
// import { User } from './common/modules/users/entities/user-entity';
// import { Product } from './common/modules/products/entities/products-entity';
// import { Order } from './common/modules/orders/entities/order-entity';
// import { DeliveryCompany } from './common/modules/delivery/entities/delivery-compnay-entity';
// import { Driver } from './common/modules/drivers/entities/driver.entity';
// import { DeliveryLog } from './common/modules/delivery/entities/delivery-log.entity';
// import { Subscription } from './common/modules/subscription/entities/subscription.entity';
// import { Tracking } from './common/modules/delivery/entities/delivery-log.entity';
// import { Upload } from './common/modules/upload/entities/upload.entity';

// @Module({
//   imports: [
//     // Configuration
//     ConfigModule.forRoot({
//       isGlobal: true,
//       envFilePath: '.env',
//     }),

//     // Database
//     SequelizeModule.forRoot({
//       dialect: 'postgres',
//       host: process.env.DB_HOST,
//       port: parseInt(process.env.DB_PORT, 10) || 5432,
//       username: process.env.DB_USERNAME,
//       password: process.env.DB_PASSWORD,
//       database: process.env.DB_NAME,
//       models: [
//         User,
//         Product,
//         Order,
//         DeliveryCompany,
//         Driver,
//         DeliveryLog,
//         Subscription,
//         Tracking,
//         Upload,
//       ],
//       autoLoadModels: true,
//       synchronize: false, // Use migrations in production
//       logging: process.env.NODE_ENV === 'development' ? console.log : false,
//     }),

//     // Caching
//     CacheModule.register({
//       isGlobal: true,
//       ttl: 300, // 5 minutes (in seconds)
//       max: 100, // Maximum number of items in cache
//     }),

//     // Scheduler
//     ScheduleModule.forRoot(),

//     // Mailer
//     MailerModule.forRoot({
//       transport: {
//         host: process.env.MAIL_HOST,
//         port: parseInt(process.env.MAIL_PORT, 10) || 587,
//         secure: process.env.MAIL_SECURE === 'true', // true for 465, false for other ports
//         auth: {
//           user: process.env.MAIL_USER,
//           pass: process.env.MAIL_PASSWORD,
//         },
//       },
//       defaults: {
//         from: `"Alaba Marketplace" <${process.env.MAIL_FROM}>`,
//       },
//       template: {
//         dir: join(__dirname, 'common/modules/mailer/templates'),
//         adapter: new HandlebarsAdapter(),
//         options: {
//           strict: true,
//         },
//       },
//     }),

//     // Feature Modules
//     AuthModule,
//     UsersModule,
//     ProductsModule,
//     OrdersModule,
//     DeliveryCompanyModule,
//     DriversModule,
//     TrackingModule,
//     PaystackModule,
//     SubscriptionModule,
//     WebhooksModule,
//     UploadModule,
//     // GatewaysModule, // Uncomment when ready
//   ],
//   providers: [
//     // Global Exception Filter
//     {
//       provide: APP_FILTER,
//       useClass: HttpExceptionFilter,
//     },
//     // Global Transform Interceptor
//     {
//       provide: APP_INTERCEPTOR,
//       useClass: TransformInterceptor,
//     },
//   ],
// })
// export class AppModule {}
