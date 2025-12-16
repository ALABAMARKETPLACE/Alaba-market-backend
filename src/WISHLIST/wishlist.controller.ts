import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
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
import { WishlistDto } from "./dto/wishlist.dto";
import { CreateWishlistDto } from "./dto/create-wishlist.dto";
import { WishlistsService } from "./wishlist.service";
import { Wishlist } from "./wishlist.entity";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { AuthGuard } from "../shared/guards/auth.guard";
import { UserId } from "../shared/decorator/userId_decorator";
import { PageOptionsDto } from "../shared/dto/pageOptions.dto";
import { Roles } from "../shared/decorator/roles.decorator";
import { Role } from "../shared/enum/role.enum";

@Controller("wishlist")
@ApiTags("wishlist")
export class WishlistController {
  constructor(private readonly wishlistsService: WishlistsService) {}

  //to get all items in wishlist for a user
  @Roles(Role.User, Role.Admin, Role.Seller)
  @UseGuards(AuthGuard)
  @Get("all")
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOkResponse({ type: [WishlistDto] })
  @UsePipes(new ValidationPipe({ transform: true }))
  findAll(
    @UserId() userId: number,
    @Query() pageOpt: PageOptionsDto
  ): Promise<DataResponseDto> {
    return this.wishlistsService.findAllWithUserId(userId, pageOpt);
  }

  //add new product to wishlist if alredy exists then remove
  @Roles(Role.User, Role.Admin, Role.Seller)
  @UseGuards(AuthGuard)
  @Post()
  @ApiCreatedResponse({ type: [Wishlist] })
  @UsePipes(new ValidationPipe({ transform: true }))
  @HttpCode(201)
  @ApiBearerAuth()
  create(
    @UserId() userId: number,
    @Body() createWishlistDto: CreateWishlistDto
  ): Promise<DataResponseDto> {
    return this.wishlistsService.create(userId, createWishlistDto);
  }

  //to delete a product from wishlist
  @Roles(Role.User, Role.Admin, Role.Seller)
  @UseGuards(AuthGuard)
  @Delete(":id")
  @ApiOkResponse({ type: Wishlist })
  @ApiParam({ name: "id", required: true })
  @ApiBearerAuth()
  delete(
    @UserId() userId: number,
    @Param("id", new ParseIntPipe()) id: number
  ): Promise<DataResponseDto> {
    return this.wishlistsService.delete(userId, id);
  }
}
