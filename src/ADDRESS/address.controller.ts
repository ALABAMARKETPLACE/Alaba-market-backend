import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import { Address } from "./address.entity";
import { AddressDto } from "./dto/address.dto";
import { AddressService } from "./address.service";
import { CreateAddressDto } from "./dto/create.dto";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { AuthGuard } from "../shared/guards/auth.guard";
import { UserId } from "../shared/decorator/userId_decorator";
import { UpdateAddressDto } from "./dto/updateAddress.dto";
import { StripBodyPipe } from "../shared/pipes/strip_body.pipe";
import { Role } from "../shared/enum/role.enum";
import { Roles } from "../shared/decorator/roles.decorator";

@Controller("address")
@ApiTags("address")
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  //get all addresses for a user
  @UseGuards(AuthGuard)
  @Get("all")
  @ApiBearerAuth()
  @Header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
  @Header("Pragma", "no-cache")
  @Header("Expires", "0")
  @Header("Surrogate-Control", "no-store")
  @HttpCode(200)
  @ApiOkResponse({ type: [AddressDto] })
  findAll(@UserId() userId: number): Promise<DataResponseDto> {
    return this.addressService.findAll(userId);
  }

  @UseGuards(AuthGuard)
  @Get("me")
  @ApiBearerAuth()
  @Header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
  @Header("Pragma", "no-cache")
  @Header("Expires", "0")
  @Header("Surrogate-Control", "no-store")
  @HttpCode(200)
  @ApiOkResponse({ type: [AddressDto] })
  findMine(@UserId() userId: number): Promise<DataResponseDto> {
    return this.addressService.findAll(userId);
  }

  @UseGuards(AuthGuard)
  @Get(":id")
  @ApiBearerAuth()
  @Header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
  @Header("Pragma", "no-cache")
  @Header("Expires", "0")
  @Header("Surrogate-Control", "no-store")
  @HttpCode(200)
  @ApiOkResponse({ type: AddressDto })
  findOne(@UserId() userId: number, @Param("id", new ParseIntPipe()) id: number): Promise<DataResponseDto> {
    return this.addressService.findOne(userId, id);
  }

  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Get("all/:id")
  @ApiBearerAuth()
  @Header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
  @Header("Pragma", "no-cache")
  @Header("Expires", "0")
  @Header("Surrogate-Control", "no-store")
  @HttpCode(200)
  @ApiParam({ name: "id", required: true })
  @ApiOkResponse({ type: [AddressDto] })
  findAllAddress(
    @Param("id", new ParseIntPipe()) userId: number
  ): Promise<DataResponseDto> {
    return this.addressService.findAll(userId);
  }

  //create new address
  @UseGuards(AuthGuard)
  @Post()
  @ApiCreatedResponse({ type: [Address] })
  @HttpCode(201)
  @ApiBearerAuth()
  create(
    @UserId() userId: number,
    @Body(new StripBodyPipe(["default"])) createAddressDto: CreateAddressDto
  ): Promise<DataResponseDto> {
    return this.addressService.create(userId, createAddressDto);
  }

  @UseGuards(AuthGuard)
  @Put(":id")
  @ApiOkResponse({ type: Address })
  @ApiParam({ name: "id", required: true })
  @ApiBearerAuth()
  @HttpCode(200)
  update(
    @UserId() userId: number,
    @Param("id", new ParseIntPipe()) id: number,
    @Body(new StripBodyPipe())
    body: UpdateAddressDto
  ): Promise<DataResponseDto> {
    return this.addressService.update(userId, id, body);
  }

  @UseGuards(AuthGuard)
  @Put("setdefault/:id")
  @ApiOkResponse({ type: Address })
  @ApiParam({ name: "id", required: true })
  @ApiBearerAuth()
  @HttpCode(200)
  setDefault(
    @UserId() userId: number,
    @Param("id", new ParseIntPipe()) id: number
  ): Promise<DataResponseDto> {
    return this.addressService.setDefault(userId, id);
  }

  @UseGuards(AuthGuard)
  @Delete(":id")
  @ApiOkResponse({ type: Address })
  @ApiParam({ name: "id", required: true })
  @ApiBearerAuth()
  delete(
    @UserId() userId: number,
    @Param("id", new ParseIntPipe()) id: number
  ): Promise<DataResponseDto> {
    return this.addressService.delete(userId, id);
  }
}
