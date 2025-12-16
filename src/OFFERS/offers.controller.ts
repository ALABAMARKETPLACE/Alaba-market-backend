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
import { OffersDto } from "./dto/offers.dto";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { OffersService } from "./offers.service";
import { CreateOffersDto } from "./dto/createOffers.dto";
import { UpdateOffersDto } from "./dto/updateOffers.dto";
import { OffersQueryDto } from "./dto/query.dto";
import { AuthGuard } from "../shared/guards/auth.guard";
import { Role } from "../shared/enum/role.enum";
import { Roles } from "../shared/decorator/roles.decorator";
import { StripBodyPipe } from "../shared/pipes/strip_body.pipe";
import { RRole } from "../shared/decorator/role_decorator";

@Controller("offers")
@ApiTags("offers")
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Get()
  @UsePipes(new ValidationPipe({ transform: true }))
  @HttpCode(200)
  getAll(@Query() query: OffersQueryDto): Promise<DataResponseDto> {
    return this.offersService.findAll(query, null);
  }

  @Get('all')
  @UsePipes(new ValidationPipe({ transform: true }))
  @HttpCode(200)
  getOffers(@Query() query: OffersQueryDto): Promise<DataResponseDto> {
    return this.offersService.findOffers(query, null);
  }

  @Roles(Role.Admin, Role.Seller)
  @UseGuards(AuthGuard)
  @Get("auth")
  @UsePipes(new ValidationPipe({ transform: true }))
  @HttpCode(200)
  findAllAdmin(
    @RRole() role: string,
    @Query() query: OffersQueryDto
  ): Promise<DataResponseDto> {
    return this.offersService.findAll(query, role);
  }

  @Get(":slug")
  @HttpCode(200)
  @ApiParam({ name: "slug", required: true })
  getOne(@Param("slug") id: string): Promise<DataResponseDto> {
    return this.offersService.getOne(id);
  }

  // @Roles(Role.Admin)
  // @UseGuards(AuthGuard)
  @Post()
  @HttpCode(201)
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiCreatedResponse({ type: OffersDto })
  create(
    @Body(new StripBodyPipe()) body: CreateOffersDto
  ): Promise<DataResponseDto> {
    return this.offersService.create(body);
  }

  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Put(":id")
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiParam({ name: "id", required: true })
  @ApiCreatedResponse({ type: OffersDto })
  update(
    @Param("id", new ParseIntPipe()) id: number,
    @Body(new StripBodyPipe()) body: UpdateOffersDto
  ): Promise<DataResponseDto> {
    return this.offersService.update(id, body);
  }

  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Delete(":id")
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiParam({ name: "id", required: true })
  @ApiCreatedResponse({ type: OffersDto })
  delete(
    @Param("id", new ParseIntPipe()) id: number
  ): Promise<DataResponseDto> {
    return this.offersService.delete(id);
  }

  @Delete("offer_product/:id")
  @Roles(Role.Seller, Role.Admin)
  @UseGuards(AuthGuard)
  @ApiOkResponse({ type: OffersDto })
  @ApiParam({ name: "id", required: true })
  @ApiBearerAuth()
  deleteBannerProduct(
    @Param("id", new ParseIntPipe()) id: number
  ): Promise<DataResponseDto> {
    return this.offersService.deleteOfferProducts(id);
  }
}
