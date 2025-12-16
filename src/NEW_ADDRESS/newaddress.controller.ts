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
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import { NewAddress } from "./newaddress.entity";
import { NewAddressDto } from "./dto/newaddress.dto";
import { NewAddressService } from "./newaddress.service";
import { CreateNewAddressDto } from "./dto/create.dto";
import { UpdateNewAddressDto } from "./dto/update.dto";
import { GetAllNewAddressDto } from "./dto/getAll.dto";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { UserId } from "../shared/decorator/userId_decorator";
import { AuthGuard } from "../shared/guards/auth.guard";

@Controller("new-address")
@ApiTags("new-address")
export class NewAddressController {
  constructor(private readonly newAddressService: NewAddressService) {}

  // Get all addresses for logged-in user (with pagination and search)
  @Get()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOkResponse({ type: NewAddressDto })
  findAll(
    @UserId() userId: number,
    @Query() params: GetAllNewAddressDto
  ): Promise<DataResponseDto> {
    return this.newAddressService.findAll(userId, params);
  }

  // Get one address by ID
  @Get(":id")
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiParam({ name: "id", required: true })
  @ApiOkResponse({ type: NewAddressDto })
  findOne(
    @UserId() userId: number,
    @Param("id", new ParseIntPipe()) id: number
  ): Promise<DataResponseDto> {
    return this.newAddressService.findOne(userId, id);
  }

  // Create new address
  @Post()
  @UseGuards(AuthGuard)
  @ApiCreatedResponse({ type: NewAddress })
  @HttpCode(201)
  @ApiBearerAuth()
  create(
    @UserId() userId: number,
    @Body() createDto: CreateNewAddressDto
  ): Promise<DataResponseDto> {
    return this.newAddressService.create(userId, createDto);
  }

  // Update address
  @Put(":id")
  @UseGuards(AuthGuard)
  @ApiOkResponse({ type: NewAddress })
  @ApiParam({ name: "id", required: true })
  @ApiBearerAuth()
  @HttpCode(200)
  update(
    @UserId() userId: number,
    @Param("id", new ParseIntPipe()) id: number,
    @Body() body: UpdateNewAddressDto
  ): Promise<DataResponseDto> {
    return this.newAddressService.update(userId, id, body);
  }

  // Delete address (soft delete)
  @Delete(":id")
  @UseGuards(AuthGuard)
  @ApiOkResponse({ type: NewAddress })
  @ApiParam({ name: "id", required: true })
  @ApiBearerAuth()
  @HttpCode(200)
  delete(
    @UserId() userId: number,
    @Param("id", new ParseIntPipe()) id: number
  ): Promise<DataResponseDto> {
    return this.newAddressService.delete(userId, id);
  }
}
