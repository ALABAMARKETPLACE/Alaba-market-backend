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
} from "@nestjs/common";
import { ApiBearerAuth, ApiParam, ApiTags } from "@nestjs/swagger";
import { InvoiceItemsService } from "./invoiceitems.service";
import { InvoiceItemsDto } from "./dto/invoiceitems.dto";
import { CreateInvoiceItemsDto } from "./dto/createInvoiceItems.dto";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { ApiDataArrayResponse } from "../shared/decorator/dto-dataArray.decorator";
import { ApiDataObjectResponse } from "../shared/decorator/dto-dataObject.decorator";

@Controller("invoiceitems")
@ApiTags("invoiceitems")
export class InvoiceItemsController {
  constructor(private readonly invoiceitemsService: InvoiceItemsService) {}
}
