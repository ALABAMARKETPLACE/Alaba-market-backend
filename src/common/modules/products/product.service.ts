// src/modules/products/products.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Product } from './entities/products-entity';
import { User } from '../users/entities/user-entity';
import { CreateProductDto } from './dto/create-product.dot';
import { Op } from 'sequelize';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product)
    private productModel: typeof Product,
  ) {}

  async create(createProductDto: CreateProductDto, sellerId: string) {
    const product = await this.productModel.create({
      ...createProductDto,
      sellerId,
      isActive: true,
    } as any);

    return product;
  }

  async findAll(filters?: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
  }) {
    const where: any = { isActive: true };

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.minPrice || filters?.maxPrice) {
      where.price = {};
      if (filters.minPrice) where.price[Op.gte] = filters.minPrice;
      if (filters.maxPrice) where.price[Op.lte] = filters.maxPrice;
    }

    if (filters?.search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${filters.search}%` } },
        { description: { [Op.iLike]: `%${filters.search}%` } },
      ];
    }

    return this.productModel.findAll({
      where,
      include: [{ model: User, as: 'seller' }],
      order: [['createdAt', 'DESC']],
    });
  }

  async findById(id: string) {
    const product = await this.productModel.findByPk(id, {
      include: [{ model: User, as: 'seller' }],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async findBySeller(sellerId: string) {
    return this.productModel.findAll({
      where: { sellerId },
      order: [['createdAt', 'DESC']],
    });
  }

  async update(id: string, sellerId: string, updateData: Partial<CreateProductDto>) {
    const product = await this.productModel.findByPk(id);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.sellerId !== sellerId) {
      throw new ForbiddenException('Not authorized to update this product');
    }

    await product.update(updateData);
    return product;
  }

  async delete(id: string, sellerId: string) {
    const product = await this.productModel.findByPk(id);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.sellerId !== sellerId) {
      throw new ForbiddenException('Not authorized to delete this product');
    }

    await product.update({ isActive: false });
    return { message: 'Product deleted successfully' };
  }

  async updateStock(id: string, quantity: number) {
    const product = await this.productModel.findByPk(id);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    await product.update({
      stock: product.stock - quantity,
    });

    return product;
  }
}