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
import { ApiBearerAuth, ApiParam, ApiTags } from "@nestjs/swagger";
import { SubscriptionPlanService } from "./subscription-plan.service";
import { SubscriptionPlanDto } from "./dto/subscription-plan.dto";
import { CreateSubscriptionPlanDto } from "./dto/create-subscription-plan.dto";
import { UpdateSubscriptionPlanDto } from "./dto/update-subscription-plan.dto";
import { GetAllSubscriptionPlansDto } from "./dto/get-all-subscription-plans.dto";
import { BulkDeleteSubscriptionPlanDto } from "./dto/bulk-delete-subscription-plan.dto";
import { UpdateFeaturedPositionDto } from "./dto/update-featured-position.dto";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { ApiDataArrayResponse } from "../shared/decorator/dto-dataArray.decorator";
import { ApiDataObjectResponse } from "../shared/decorator/dto-dataObject.decorator";
import { Roles } from "../shared/decorator/roles.decorator";
import { AuthGuard } from "../shared/guards/auth.guard";
import { Role } from "../shared/enum/role.enum";

@Controller("subscription-plans")
@ApiTags("subscription-plans")
export class SubscriptionPlanController {
  constructor(
    private readonly subscriptionPlanService: SubscriptionPlanService
  ) {}
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Get()
  @ApiBearerAuth()
  @ApiDataObjectResponse(SubscriptionPlanDto)
  findAll(
    @Query() query: GetAllSubscriptionPlansDto
  ): Promise<DataResponseDto> {
    return this.subscriptionPlanService.findAll(query);
  }

  @Roles(Role.Admin, Role.Seller)
  @UseGuards(AuthGuard)
  @Get("active")
  @ApiBearerAuth()
  @ApiDataArrayResponse(SubscriptionPlanDto)
  findAllActive(): Promise<DataResponseDto> {
    return this.subscriptionPlanService.findAllActive();
  }

  // Public endpoint for onboarding (no auth required)
  @Get("public/active")
  @ApiDataArrayResponse(SubscriptionPlanDto)
  findAllActivePublic(): Promise<DataResponseDto> {
    return this.subscriptionPlanService.findAllActive();
  }

  @Roles(Role.Admin, Role.Seller)
  @UseGuards(AuthGuard)
  @Get(":id")
  @ApiParam({ name: "id", required: true })
  @ApiBearerAuth()
  @ApiDataObjectResponse(SubscriptionPlanDto)
  findOne(
    @Param("id", new ParseIntPipe()) id: number
  ): Promise<DataResponseDto> {
    return this.subscriptionPlanService.findOne(id);
  }

  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Post()
  @ApiDataObjectResponse(SubscriptionPlanDto)
  @HttpCode(201)
  @ApiBearerAuth()
  create(
    @Body() createDto: CreateSubscriptionPlanDto
  ): Promise<DataResponseDto> {
    return this.subscriptionPlanService.create(createDto);
  }

  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Put()
  @ApiDataObjectResponse(SubscriptionPlanDto)
  @ApiBearerAuth()
  update(
    @Body() updateDto: UpdateSubscriptionPlanDto
  ): Promise<DataResponseDto> {
    return this.subscriptionPlanService.update(updateDto);
  }

  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Delete(":id")
  @ApiDataObjectResponse(SubscriptionPlanDto)
  @ApiParam({ name: "id", required: true })
  @ApiBearerAuth()
  delete(
    @Param("id", new ParseIntPipe()) id: number
  ): Promise<DataResponseDto> {
    return this.subscriptionPlanService.delete(id);
  }

  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Post("bulk-delete")
  @ApiDataObjectResponse(SubscriptionPlanDto)
  @HttpCode(200)
  @ApiBearerAuth()
  bulkDelete(
    @Body() bulkDeleteDto: BulkDeleteSubscriptionPlanDto
  ): Promise<DataResponseDto> {
    return this.subscriptionPlanService.bulkDelete(bulkDeleteDto.ids);
  }

  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Put("featured-position")
  @ApiDataObjectResponse(SubscriptionPlanDto)
  @ApiBearerAuth()
  updateFeaturedPosition(
    @Body() updateDto: UpdateFeaturedPositionDto
  ): Promise<DataResponseDto> {
    return this.subscriptionPlanService.updateFeaturedPosition(updateDto);
  }
}
