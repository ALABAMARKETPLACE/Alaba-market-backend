
// src/modules/products/products.module.ts
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ProductsController } from './product.cvontroller';
import { ProductsService } from './product.service';
import { Product } from './entities/products-entity';
import { User } from '../users/entities/user-entity';

@Module({
  imports: [SequelizeModule.forFeature([Product, User])],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}