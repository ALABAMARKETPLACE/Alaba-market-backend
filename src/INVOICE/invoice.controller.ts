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
} from "@nestjs/common";
import { ApiBearerAuth, ApiParam, ApiTags } from "@nestjs/swagger";
import { invoiceDto } from "./dto/invoice.dto";
import { CreateInvoiceDto } from "./dto/createInvoice.dto";
import { ApiDataObjectResponse } from "../shared/decorator/dto-dataObject.decorator";
import { InvoiceService } from "./invoice.service";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { UpdateInvoiceDto } from "./dto/updateInvoice.dto";
import { AuthGuard } from "../shared/guards/auth.guard";

import { Roles } from "../shared/decorator/roles.decorator";
import { Role } from "../shared/enum/role.enum";
import { PageOptionsDto } from "../shared/dto/pageOptions.dto";
import { PageOptionsInvoiceDto } from "./dto/searchInvoice.dto";

@Controller("invoice")
@ApiTags("invoice")
export class InvoiceController {
  constructor(private readonly InvoiceService: InvoiceService) {}
  @Post("create")
  @ApiDataObjectResponse(invoiceDto)
  @HttpCode(200)
  create(@Body() create: CreateInvoiceDto): Promise<DataResponseDto> {
    return this.InvoiceService.create(create);
  }

  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Get("all")
  @ApiDataObjectResponse(invoiceDto)
  @ApiBearerAuth()
  @HttpCode(200)
  findAll(@Query() query: PageOptionsInvoiceDto): Promise<any> {
    return this.InvoiceService.findAll(query);
  }

  @UseGuards(AuthGuard)
  @Get(":id")
  @ApiDataObjectResponse(invoiceDto)
  @ApiParam({ name: "id", required: true })
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @HttpCode(200)
  findOne(
    @Param("id", new ParseIntPipe()) id: number
  ): Promise<DataResponseDto> {
    return this.InvoiceService.findOne(id);
  }

  @Get("get/:token")
  @ApiDataObjectResponse(invoiceDto)
  @ApiParam({ name: "token", required: true })
  @HttpCode(200)
  getInvoice(@Param("token") token: string): Promise<DataResponseDto> {
    return this.InvoiceService.getInvoice(token);
  }

  // @UseGuards(AuthGuard)
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Put(":id")
  @ApiDataObjectResponse(invoiceDto)
  @ApiParam({ name: "id", required: true })
  update(
    @Param("id", new ParseIntPipe()) id: number,
    @Body() updateData: UpdateInvoiceDto
  ): Promise<DataResponseDto> {
    return this.InvoiceService.update(updateData, id);
  }

  @UseGuards(AuthGuard)
  @Delete(":id")
  @ApiDataObjectResponse(invoiceDto)
  @ApiParam({ name: "id", required: true })
  delete(
    @Param("id", new ParseIntPipe()) id: number
  ): Promise<DataResponseDto> {
    return this.InvoiceService.delete(id);
  }
}
