import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";

import { Category } from "./category.entity";
import { CategoryDto } from "./dto/category.dto";
import { CreateCategoryDto } from "./dto/create.dto";
import { CategoryService } from "./category.services";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { Roles } from "../shared/decorator/roles.decorator";
import { Role } from "../shared/enum/role.enum";
import { AuthGuard } from "../shared/guards/auth.guard";
import { CategorySearchDto } from "./dto/category_search.dto";
import { UpdateCategoryPositionDto } from "./dto/updateCategoryPosition.dto";
import { UpdateCategoryDto } from "./dto/update.dto";
import { CategoryCacheInterceptor } from "../shared/interceptor/category.cache.interceptor";
import { CategoryUpdateInterceptor } from "../shared/interceptor/update_category.interceptor";

@Controller("category")
@ApiTags("category")
export class CategoryController {
  constructor(private readonly CategoryService: CategoryService) {}

  @Get()
  @UseInterceptors(CategoryCacheInterceptor)
  @HttpCode(200)
  @ApiOkResponse({ type: [CategoryDto] })
  findAllCategory(): Promise<DataResponseDto> {
    return this.CategoryService.findAllCategory();
  }

  @Get("featured")
  @HttpCode(200)
  @ApiOkResponse({ type: [CategoryDto] })
  findFeatured(): Promise<any> {
    return this.CategoryService.findFeatured();
  }

  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Get("all")
  @ApiBearerAuth()
  @HttpCode(200)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOkResponse({ type: [CategoryDto] })
  findAll(@Query() pageOpt: CategorySearchDto): Promise<any> {
    return this.CategoryService.findAll(pageOpt);
  }

  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @UseInterceptors(CategoryUpdateInterceptor)
  @Post()
  @ApiCreatedResponse({ type: [Category] })
  @HttpCode(201)
  @ApiBearerAuth()
  create(
    @Body() createCategoryDto: CreateCategoryDto
  ): Promise<DataResponseDto> {
    return this.CategoryService.create(createCategoryDto);
  }

  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @UseInterceptors(CategoryUpdateInterceptor)
  @Put(":id")
  @HttpCode(200)
  @ApiOkResponse({ type: Category })
  @ApiParam({ name: "id", required: true })
  @ApiBearerAuth()
  update(
    @Param("id", new ParseIntPipe()) id: number,
    @Body() createProductsDto: UpdateCategoryDto
  ): Promise<DataResponseDto> {
    return this.CategoryService.update(id, createProductsDto);
  }

  //to update position of thecategory
  @Roles(Role.Admin)
  @Put("position/:id")
  @UseInterceptors(CategoryUpdateInterceptor)
  @UseGuards(AuthGuard)
  @ApiOkResponse({ type: Category })
  @ApiParam({ name: "id", required: true })
  @ApiBearerAuth()
  updatePosition(
    @Param("id", new ParseIntPipe()) id: number,
    @Body() updatePositionDto: UpdateCategoryPositionDto
  ): Promise<DataResponseDto> {
    return this.CategoryService.updatePosition(id, updatePositionDto);
  }

  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @UseInterceptors(CategoryUpdateInterceptor)
  @Delete(":id")
  @ApiOkResponse({ type: Category })
  @ApiParam({ name: "id", required: true })
  @ApiBearerAuth()
  delete(
    @Param("id", new ParseIntPipe()) id: number
  ): Promise<DataResponseDto> {
    return this.CategoryService.delete(id);
  }
}
