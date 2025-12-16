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
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import { BusinessTypeService } from "./businesstype.service";
import { BusinessTypeDto } from "./dto/businesstype.dto";
import { CreateBusinessTypeDto } from "./dto/createBusinessType.dto";
import { UpdateBusinessTypeDto } from "./dto/updateBusinessType.dto";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { ApiDataArrayResponse } from "../shared/decorator/dto-dataArray.decorator";
import { ApiDataObjectResponse } from "../shared/decorator/dto-dataObject.decorator";
import { Roles } from "../shared/decorator/roles.decorator";
import { Role } from "../shared/enum/role.enum";
import { AuthGuard } from "../shared/guards/auth.guard";

@Controller("businesstype")
@ApiTags("businesstype")
export class BusinessTypeController {
  constructor(private readonly businesstypeService: BusinessTypeService) {}

  @Get()
  @ApiBearerAuth()
  @ApiDataArrayResponse(BusinessTypeDto)
  findAll(): Promise<DataResponseDto> {
    return this.businesstypeService.findAll();
  }

  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Post()
  @ApiDataObjectResponse(BusinessTypeDto)
  @HttpCode(201)
  @ApiBearerAuth()
  create(@Body() create: CreateBusinessTypeDto): Promise<DataResponseDto> {
    return this.businesstypeService.create(create);
  }

  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Put(":id")
  @ApiDataObjectResponse(BusinessTypeDto)
  @ApiParam({ name: "id", required: true })
  @ApiBearerAuth()
  update(
    @Param("id", new ParseIntPipe()) id: number,
    @Body() update: UpdateBusinessTypeDto
  ): Promise<DataResponseDto> {
    return this.businesstypeService.update(id, update);
  }

  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Delete(":id")
  @ApiDataObjectResponse(BusinessTypeDto)
  @ApiParam({ name: "id", required: true })
  @ApiBearerAuth()
  delete(
    @Param("id", new ParseIntPipe()) id: number
  ): Promise<DataResponseDto> {
    return this.businesstypeService.delete(id);
  }
}
