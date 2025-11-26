// src/modules/products/products.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProductsService } from './product.service';
import { CreateProductDto } from './dto/create-product.dot';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/role.decorator';
import { UserRole } from '../../enums/user-role.enum';
import { Public } from '../../decorators/public.decorator';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.SELLER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create product' })
  create(@Body() dto: CreateProductDto, @Req() req: any) {
    return this.productsService.create(dto, req.user.id);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all products (Public)' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'minPrice', required: false })
  @ApiQuery({ name: 'maxPrice', required: false })
  @ApiQuery({ name: 'search', required: false })
  async findAll(
    @Query('category') category?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('search') search?: string,
  ) {
    const items = await this.productsService.findAll({
      category,
      minPrice,
      maxPrice,
      search,
    });
    return {
      success: true,
      data: {
        items,
        total: items.length,
        page: 1,
        limit: items.length,
        totalPages: 1,
      },
    };
  }

  @Get('my-products')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.SELLER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get seller products' })
  async getMyProducts(@Req() req: any) {
    const items = await this.productsService.findBySeller(req.user.id);
    return {
      success: true,
      data: {
        items,
        total: items.length,
        page: 1,
        limit: items.length,
        totalPages: 1,
      },
    };
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get product by ID (Public)' })
  async findById(@Param('id') id: string) {
    const product = await this.productsService.findById(id);
    return {
      success: true,
      data: product,
    };
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.SELLER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update product' })
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateProductDto>,
    @Req() req: any,
  ) {
    return this.productsService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.SELLER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete product' })
  delete(@Param('id') id: string, @Req() req: any) {
    return this.productsService.delete(id, req.user.id);
  }
}