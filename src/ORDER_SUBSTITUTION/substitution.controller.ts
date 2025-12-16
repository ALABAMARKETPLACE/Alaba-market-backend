import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { ApiBearerAuth, ApiParam, ApiTags } from "@nestjs/swagger";
import { OrderSubstitutionService } from "./substitution.service";
import { CreateSubstitutionDto } from "./dto/create.dto";
import { Roles } from "../shared/decorator/roles.decorator";
import { Role } from "../shared/enum/role.enum";
import { AuthGuard } from "../shared/guards/auth.guard";
import { StoreId } from "../shared/decorator/storeId_decorator";
import { UserId } from "../shared/decorator/userId_decorator";
import { SubstituteOrderDto } from "./dto/substitue.order.dto";
import { UUID } from "crypto";

@Controller("substitution")
@ApiTags("substitution")
export class SubstitutionController {
  constructor(private readonly services: OrderSubstitutionService) {}

  //   @UseGuards(AuthGuard)
  @Get("details/:id")
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiParam({ name: "id", required: true })
  getDetails(@UserId() userId: number, @Param("id") orderId: number) {
    return this.services.getSubstitution(orderId);
  }

  @UseGuards(AuthGuard)
  @Get("five-mint-check")
  @ApiBearerAuth()
  @ApiBearerAuth()
  @UsePipes(new ValidationPipe({ transform: true }))
  getFiveMintCheck(@UserId() userId: number) {
    return this.services.getFiveMintCheck(userId);
  }

  @Roles(Role.Seller, Role.Admin)
  @UseGuards(AuthGuard)
  @Post("create")
  @UsePipes(new ValidationPipe({ transform: true }))
  substitution(
    @Body() body: CreateSubstitutionDto,
    @StoreId() storeId: number
  ) {
    return this.services.create(body, storeId);
  }

  @UseGuards(AuthGuard)
  @Put("substitute/:id")
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiParam({ name: "id", required: true })
  substitute(
    @Body() body: SubstituteOrderDto,
    @Param("id") id: number,
    @UserId() userId: number
  ) {
    return this.services.substituteOrder(userId, id, body.productId);
  }

  @UseGuards(AuthGuard)
  @Put("update_order/:id")
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiParam({ name: "id", required: true })
  updateOrder(@Param("id") id: number, @UserId() userId: number) {
    return this.services.updateOrder(userId, id);
  }
}
