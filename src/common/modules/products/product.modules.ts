// src/modules/products/products.module.ts
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ProductsController } from './product.cvontroller';
import { ProductsService } from './product.service';
import { Product } from './entities/products-entity';
import { User } from '../users/entities/user-entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [SequelizeModule.forFeature([Product, User]), NotificationsModule],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
