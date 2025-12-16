import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { CreatePrintConfigerationDto } from "./dto/create_print_configeration.dto";
import {
  PrintConfigerationDto,
  PrintPriceDto,
} from "./dto/print_configeration.dto";
import { UpdatePrintConfigerationDto } from "./dto/update_print_configeration.dto";
import { PrintConfigerationService } from "./print_configeration.service";
import { PageOptionsGetConfiguraitionDto } from "./dto/getPrintConfiguration.dto";
import { PrintConfigeration } from "./print_configeration.entity";
import { DataResponseDto } from "../shared/dto/data-response-dto";
@Controller("Print_Configeration")
@ApiTags("Print_Configeration")
export class PrintConfigerationController {
  constructor(
    private readonly printConfigerationService: PrintConfigerationService
  ) {}
  @Post("bulk")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Bulk create print configurations" })
  @ApiOkResponse({ type: [PrintConfigerationDto] })
  @ApiBody({
    type: [CreatePrintConfigerationDto],
    description: "An array of print configuration objects to create",
  })
  async createMany(@Body() body: CreatePrintConfigerationDto[]) {
    return this.printConfigerationService.createBulk(body);
  }

  @Get()
  @ApiOperation({ summary: "Get all print configurations" })
  @ApiResponse({ status: 200, description: "List of configurations" })
  @UsePipes(new ValidationPipe({ transform: true }))
  async findAll(@Query() pageOptions: PageOptionsGetConfiguraitionDto) {
    return this.printConfigerationService.findAll(pageOptions);
  }
  @Put(":id")
  @ApiOperation({ summary: "Update a configuration by ID" })
  @ApiParam({ name: "id", type: Number })
  @ApiBody({ type: UpdatePrintConfigerationDto })
  @ApiOkResponse({ type: [PrintConfigerationDto] })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdatePrintConfigerationDto
  ) {
    return this.printConfigerationService.update(id, dto);
  }

  @Get("price")
  @ApiOperation({ summary: "Get price for each configuration" })
  @ApiResponse({ status: 200, description: "Price of each configurations" })
  async findPrice(@Query() query: PrintPriceDto) {
    return this.printConfigerationService.findPrice(query);
  }

  @Get("configurations")
  @ApiOperation({ summary: "Get unique print types and colors" })
  @ApiResponse({ status: 200, description: "Unique print configurations" })
  async findUniqueConfigurations() {
    return this.printConfigerationService.findUniqueConfigurations();
  }

  @Delete(":id")
    @ApiOkResponse({ type: PrintConfigeration })
    @ApiParam({ name: "id", required: true })
    delete(
      @Param("id", new ParseIntPipe()) id: number
    ): Promise<DataResponseDto> {
      return this.printConfigerationService.delete(id);
    }
}
