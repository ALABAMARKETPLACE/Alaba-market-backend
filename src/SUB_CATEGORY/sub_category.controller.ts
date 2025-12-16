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

import { SubCategoryService } from "./sub_category.services";
import { SubCategory } from "./sub_category.entity";
import { CreateSubCategoryDto } from "./dto/create.dto";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { Roles } from "../shared/decorator/roles.decorator";
import { Role } from "../shared/enum/role.enum";
import { AuthGuard } from "../shared/guards/auth.guard";
import { PageOptionsDtoSubcategory } from "./dto/search_subcategory.dto";
import { UpdateSubcategoryPositionDto } from "./dto/updatePosition.dto";
import { UpdateSubCategoryDto } from "./dto/update.dto";
import { CategoryUpdateInterceptor } from "../shared/interceptor/update_category.interceptor";
@Controller("subCategory")
@ApiTags("subCategory")
export class SubCategoryController {
  constructor(private readonly SubCategoryService: SubCategoryService) {}

  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Get("all")
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOkResponse({ type: [SubCategory] })
  findAll(@Query() pageOpt: PageOptionsDtoSubcategory): Promise<any> {
    return this.SubCategoryService.findAll(pageOpt);
  }

  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Post()
  @UseInterceptors(CategoryUpdateInterceptor)
  @ApiCreatedResponse({ type: [SubCategory] })
  @UsePipes(new ValidationPipe({ transform: true }))
  @HttpCode(200)
  @ApiBearerAuth()
  create(@Body() create: CreateSubCategoryDto): Promise<DataResponseDto> {
    return this.SubCategoryService.create(create);
  }

  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Put(":id")
  @UseInterceptors(CategoryUpdateInterceptor)
  @ApiOkResponse({ type: SubCategory })
  @ApiParam({ name: "id", required: true })
  @ApiBearerAuth()
  update(
    @Param("id", new ParseIntPipe()) id: number,
    @Body() updateSubCategoryDto: UpdateSubCategoryDto
  ): Promise<DataResponseDto> {
    return this.SubCategoryService.update(id, updateSubCategoryDto);
  }

  //to update postioin
  @Roles(Role.Admin)
  @Put("position/:id")
  @UseInterceptors(CategoryUpdateInterceptor)
  @UseGuards(AuthGuard)
  @ApiOkResponse({ type: SubCategory })
  @ApiParam({ name: "id", required: true })
  @ApiBearerAuth()
  updatePosition(
    @Param("id", new ParseIntPipe()) id: number,
    @Body() updatePositionDto: UpdateSubcategoryPositionDto
  ): Promise<DataResponseDto> {
    return this.SubCategoryService.updatePosition(id, updatePositionDto);
  }

  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Delete(":id")
  @UseInterceptors(CategoryUpdateInterceptor)
  @ApiOkResponse({ type: SubCategory })
  @ApiParam({ name: "id", required: true })
  @ApiBearerAuth()
  delete(
    @Param("id", new ParseIntPipe()) id: number
  ): Promise<DataResponseDto> {
    return this.SubCategoryService.delete(id);
  }
}
