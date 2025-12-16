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
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import { UserId } from "../shared/decorator/userId_decorator";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { AuthGuard } from "../shared/guards/auth.guard";
import { StripBodyPipe } from "../shared/pipes/strip_body.pipe";
import { CreateUserBankAccountDto } from "./dto/create_user_bank_accounts.dto";
import { UpdateUserBankAccountDto } from "./dto/update_user_bank_accounts.dto";
import { UserBankAccountService } from "./user_bank_accounts.service";

@Controller("user-bank-account")
@ApiTags("user-bank-account")
export class UserBankAccountController {
  constructor(
    private readonly userBankAccountService: UserBankAccountService
  ) {}

  //get all addresses for a user
  // @UseGuards(AuthGuard)
  // @Get("all")
  // @ApiBearerAuth()
  // @HttpCode(200)
  // @ApiOkResponse({ type: [AddressDto] })
  // findAll(@UserId() userId: number): Promise<DataResponseDto> {
  //   return this.addressService.findAll(userId);
  // }

  // @Roles(Role.Admin)
  // @UseGuards(AuthGuard)
  // @Get("all/:id")
  // @ApiBearerAuth()
  // @HttpCode(200)
  // @ApiParam({ name: "id", required: true })
  // @ApiOkResponse({ type: [AddressDto] })
  // findAllAddress(
  //   @Param("id", new ParseIntPipe()) userId: number
  // ): Promise<DataResponseDto> {
  //   return this.addressService.findAll(userId);
  // }

  //create new address
  @UseGuards(AuthGuard)
  @Post()
  @ApiCreatedResponse({ type: DataResponseDto })
  @HttpCode(201)
  @ApiBearerAuth()
  create(
    @UserId() userId: number,
    @Body(new StripBodyPipe(["default"]))
    createAddressDto: CreateUserBankAccountDto
  ): Promise<DataResponseDto> {
    return this.userBankAccountService.create(userId, createAddressDto);
  }
  @UseGuards(AuthGuard)
  @Put(":id")
  @ApiOkResponse({ type: DataResponseDto })
  @ApiParam({ name: "id", required: true })
  @ApiBearerAuth()
  async update(
    @UserId() userId: number,
    @Param("id", ParseIntPipe) id: number,
    @Body() updateUserBankAccountDto: UpdateUserBankAccountDto
  ): Promise<DataResponseDto> {
    return this.userBankAccountService.update(
      userId,
      id,
      updateUserBankAccountDto
    );
  }
  @UseGuards(AuthGuard)
  @Delete("soft/:id")
  @ApiOkResponse({ type: DataResponseDto })
  @ApiParam({ name: "id", required: true })
  @ApiBearerAuth()
  async delete(
    @UserId() userId: number,
    @Param("id", ParseIntPipe) id: number
  ): Promise<DataResponseDto> {
    return this.userBankAccountService.softDelete(userId, id);
  }

  @UseGuards(AuthGuard)
  @Get()
  @ApiOkResponse({ type: DataResponseDto })
  @ApiBearerAuth()
  findAll(@UserId() userId: number): Promise<DataResponseDto> {
    return this.userBankAccountService.findAll(userId);
  }
  @UseGuards(AuthGuard)
  @Get(":id")
  @ApiOkResponse({ type: DataResponseDto })
  @ApiBearerAuth()
  @ApiParam({ name: "id", required: true })
  findById(
    @UserId() userId: number,
    @Param("id") id: number
  ): Promise<DataResponseDto> {
    return this.userBankAccountService.findAllById(userId, id);
  }

  // @UseGuards(AuthGuard)
  // @Put(":id")
  // @ApiOkResponse({ type: Address })
  // @ApiParam({ name: "id", required: true })
  // @ApiBearerAuth()
  // @HttpCode(200)
  // update(
  //   @UserId() userId: number,
  //   @Param("id", new ParseIntPipe()) id: number,
  //   @Body(new StripBodyPipe())
  //   body: UpdateAddressDto
  // ): Promise<DataResponseDto> {
  //   return this.addressService.update(userId, id, body);
  // }

  // @UseGuards(AuthGuard)
  // @Put("setdefault/:id")
  // @ApiOkResponse({ type: Address })
  // @ApiParam({ name: "id", required: true })
  // @ApiBearerAuth()
  // @HttpCode(200)
  // setDefault(
  //   @UserId() userId: number,
  //   @Param("id", new ParseIntPipe()) id: number
  // ): Promise<DataResponseDto> {
  //   return this.addressService.setDefault(userId, id);
  // }

  // @UseGuards(AuthGuard)
  // @Delete(":id")
  // @ApiOkResponse({ type: Address })
  // @ApiParam({ name: "id", required: true })
  // @ApiBearerAuth()
  // delete(
  //   @UserId() userId: number,
  //   @Param("id", new ParseIntPipe()) id: number
  // ): Promise<DataResponseDto> {
  //   return this.addressService.delete(userId, id);
  // }
}
