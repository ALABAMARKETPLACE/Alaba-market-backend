import {
  Controller,
  Body,
  Post,
  UseGuards,
  Get,
  Param,
  ParseIntPipe,
  Delete,
  Put,
  HttpCode,
  Query,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import {
  ApiCreatedResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import { CartDataResponseDto, CartDto } from "./dto/cart.dto";
import { CreateCartDto } from "./dto/cart_create.dto";
import { CartTable } from "./cart.entity";
import { CartServices } from "./cart.services";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { AuthGuard } from "../shared/guards/auth.guard";
import { UserId } from "../shared/decorator/userId_decorator";
import { StripBodyPipe } from "../shared/pipes/strip_body.pipe";

@Controller("cart")
@ApiTags("cart")
export class CartController {
  constructor(private readonly cartService: CartServices) {}

  //to get all items in cart for a user
  @UseGuards(AuthGuard)
  @Get("all")
  @ApiOkResponse({ type: [CartDto] })
  @ApiBearerAuth()
  @HttpCode(200)
  findCartByUserID(@UserId() userId: number): Promise<DataResponseDto> {
    return this.cartService.findByUserId(userId);
  }

  //add an item to cart. if already exist increase the quantity by 1
  @UseGuards(AuthGuard)
  @Post()
  @ApiCreatedResponse({ type: [CartTable] })
  @UsePipes(new ValidationPipe({ transform: true }))
  @HttpCode(200)
  @ApiBearerAuth()
  create(
    @UserId() userId: number,
    @Body(new StripBodyPipe()) createCart: CreateCartDto
  ): Promise<CartDataResponseDto> {
    return this.cartService.create(userId, createCart);
  }

  //update the quantity of items in cart increase or decrease by 1
  @UseGuards(AuthGuard)
  @Put(":id")
  @ApiOkResponse({ type: [CartDto] })
  @ApiParam({ name: "id", required: true })
  @ApiBearerAuth()
  update(
    @UserId() userId: number,
    @Param("id", new ParseIntPipe()) id: number,
    @Query("action") action: string //actions should be either add or reduce
  ): Promise<DataResponseDto> {
    return this.cartService.update(userId, id, action);
  }

  //clear all cart items for a user
  @UseGuards(AuthGuard)
  @Delete("clear-all")
  @ApiOkResponse({ type: CartTable })
  @ApiBearerAuth()
  clearAll(@UserId() userId: number): Promise<DataResponseDto> {
    return this.cartService.clearCart(userId);
  }

  //to remove one item from cart by product UUID/internal product id
  @UseGuards(AuthGuard)
  @Delete("product/:productId")
  @ApiOkResponse({ type: CartTable })
  @ApiParam({ name: "productId", required: true })
  @ApiBearerAuth()
  deleteByProduct(
    @UserId() userId: number,
    @Param("productId") productId: string,
    @Query("variantId") variantId?: string
  ): Promise<DataResponseDto> {
    return this.cartService.deleteByProduct(userId, productId, variantId);
  }

  //to remove one item from cart
  @UseGuards(AuthGuard)
  @Delete(":id")
  @ApiOkResponse({ type: CartTable })
  @ApiParam({ name: "id", required: true })
  @ApiBearerAuth()
  delete(
    @UserId() userId: number,
    @Param("id") id: string,
    @Query("variantId") variantId?: string
  ): Promise<DataResponseDto> {
    return this.cartService.delete(userId, id, variantId);
  }
}
