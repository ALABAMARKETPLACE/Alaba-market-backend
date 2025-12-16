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
import { ApiBearerAuth, ApiParam, ApiTags } from "@nestjs/swagger";
import { DeliveryChargeService } from "./deliverycharge.service";
import { DeliveryChargeDto } from "./dto/deliverycharge.dto";
import { CreateDeliveryChargeDto } from "./dto/createDeliveryCharge.dto";
import { UpdateDeliveryChargeDto } from "./dto/updateDeliveryCharge.dto";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { ApiDataArrayResponse } from "../shared/decorator/dto-dataArray.decorator";
import { ApiDataObjectResponse } from "../shared/decorator/dto-dataObject.decorator";
import { Roles } from "../shared/decorator/roles.decorator";
import { AuthGuard } from "../shared/guards/auth.guard";
import { Role } from "../shared/enum/role.enum";
import { UpsertDeliveryChargeDto } from "./dto/upsertDeliveryCharge.dto";
@Controller("deliverycharge")
@ApiTags("deliverycharge")
export class DeliveryChargeController {
  constructor(private readonly deliveryChargeService: DeliveryChargeService) {}

  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Get()
  @ApiBearerAuth()
  @ApiDataArrayResponse(DeliveryChargeDto)
  findAll(): Promise<DataResponseDto> {
    return this.deliveryChargeService.findAll();
  }

  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Post()
  @ApiDataObjectResponse(DeliveryChargeDto)
  @HttpCode(201)
  @ApiBearerAuth()
  create(@Body() create: CreateDeliveryChargeDto[]): Promise<DataResponseDto> {
    return this.deliveryChargeService.create(create);
  }

  // if id is present update else create
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Post("upsert")
  @ApiDataObjectResponse(DeliveryChargeDto)
  @HttpCode(201)
  @ApiBearerAuth()
  upsertCharge(
    @Body() body: UpsertDeliveryChargeDto
  ): Promise<DataResponseDto> {
    return this.deliveryChargeService.upsertCharge(body);
  }

  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Put()
  @ApiDataObjectResponse(DeliveryChargeDto)
  @ApiBearerAuth()
  update(@Body() updates: UpdateDeliveryChargeDto[]): Promise<DataResponseDto> {
    return this.deliveryChargeService.update(updates);
  }

  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Delete(":id")
  @ApiDataObjectResponse(DeliveryChargeDto)
  @ApiParam({ name: "id", required: true })
  @ApiBearerAuth()
  delete(
    @Param("id", new ParseIntPipe()) id: number
  ): Promise<DataResponseDto> {
    return this.deliveryChargeService.delete(id);
  }
}
