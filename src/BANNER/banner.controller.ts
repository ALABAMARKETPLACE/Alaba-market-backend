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
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import { FileFieldsInterceptor } from "@nestjs/platform-express";
import { BannerService } from "./banner.service";
import { BannerDto } from "./dto/banner.dto";
import { CreateBannerDto } from "./dto/create.dto";
import { Banner } from "./banner.entity";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { AuthGuard } from "../shared/guards/auth.guard";
import { Roles } from "../shared/decorator/roles.decorator";
import { Role } from "../shared/enum/role.enum";
import { PageOptionsDtoBanner } from "./dto/banner_search.dto";
import { RRole } from "../shared/decorator/role_decorator";
import { StoreId } from "../shared/decorator/storeId_decorator";
import { UpdateBannerPositionDto } from "./dto/updatePosition.dto";
import { UpdateBannerDto } from "./dto/update.dto";
import { StripBodyPipe } from "../shared/pipes/strip_body.pipe";
import { UploadedFiles, UseInterceptors } from "@nestjs/common";

type BannerFiles = {
  img_desk?: Express.Multer.File[];
  img_mob?: Express.Multer.File[];
};

@Controller("banner")
@ApiTags("banner")
export class BannerController {
  constructor(private readonly bannerService: BannerService) {}

  //get all banners for a store/ all banners for admiin
  // @Roles(Role.Admin, Role.Seller)
  @UseGuards(AuthGuard)
  @Get("all")
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiBearerAuth()
  @ApiOkResponse({ type: [BannerDto] })
  findAll(
    @RRole() role: string,
    @StoreId() storeId: number,
    @Query() pageOpt: PageOptionsDtoBanner,
  ): Promise<DataResponseDto> | Promise<any> {
    return this.bannerService.findAll(pageOpt, storeId, role);
  }
  //create new banner
  @Post()
  @Roles(Role.Seller, Role.Admin)
  @UseGuards(AuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: "img_desk", maxCount: 1 },
      { name: "img_mob", maxCount: 1 },
    ]),
  )
  @ApiCreatedResponse({ type: [Banner] })
  @HttpCode(201)
  @ApiBearerAuth()
  @ApiConsumes("multipart/form-data")
  create(
    @RRole() role: string,
    @StoreId() storeId: number, // From JWT token (sellers only)
    @Body(new StripBodyPipe(["status", "position"], ["storeId", "store_id"]))
    body: CreateBannerDto,
    @UploadedFiles() files?: BannerFiles,
  ): Promise<DataResponseDto> {
    // ✅ For sellers: use storeId from JWT token
    // ✅ For admins: use storeId from body (if provided) or null
    const finalStoreId = role === Role.Seller ? storeId : body.storeId || null;

    return this.bannerService.create(finalStoreId, body, role, files);
  }

  //update banner
  @Put(":id")
  @Roles(Role.Seller, Role.Admin)
  @UseGuards(AuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: "img_desk", maxCount: 1 },
      { name: "img_mob", maxCount: 1 },
    ]),
  )
  @ApiOkResponse({ type: Banner })
  @ApiParam({ name: "id", required: true })
  @ApiBearerAuth()
  @ApiConsumes("multipart/form-data")
  update(
    @RRole() role: string,
    @StoreId() storeId: number,
    @Param("id", new ParseIntPipe()) id: number,
    @Body(new StripBodyPipe(["position"], ["storeId", "store_id"]))
    createBannerDto: UpdateBannerDto,
    @UploadedFiles() files?: BannerFiles,
  ): Promise<DataResponseDto> {
    // ✅ Same logic for update
    const finalStoreId =
      role === Role.Seller ? storeId : createBannerDto.storeId || null;

    return this.bannerService.update(
      finalStoreId,
      id,
      createBannerDto,
      role,
      files,
    );
  }

  // //update banner
  // @Put(":id")
  // @Roles(Role.Seller, Role.Admin)
  // @UseGuards(AuthGuard)
  // @ApiOkResponse({ type: Banner })
  // @ApiParam({ name: "id", required: true })
  // @ApiBearerAuth()
  // update(
  //   @RRole() role: string,
  //   @StoreId() storeId: number,
  //   @Param("id", new ParseIntPipe()) id: number,
  //   @Body(new StripBodyPipe(["position"]))
  //   createBannerDto: UpdateBannerDto,
  // ): Promise<DataResponseDto> {
  //   return this.bannerService.update(storeId, id, createBannerDto, role);
  // }

  @Roles(Role.Admin)
  @Put("position/:id")
  @UseGuards(AuthGuard)
  @ApiOkResponse({ type: Banner })
  @ApiParam({ name: "id", required: true })
  @ApiBearerAuth()
  updatePosition(
    @Param("id", new ParseIntPipe()) id: number,
    @Body() updatePositionDto: UpdateBannerPositionDto,
  ): Promise<DataResponseDto> {
    return this.bannerService.updatePosition(id, updatePositionDto);
  }

  //to make banner status tru/false only for admin
  @Put("status/:id")
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @ApiOkResponse({ type: Banner })
  @ApiParam({ name: "id", required: true })
  @ApiBearerAuth()
  updateStatus(
    @Param("id", new ParseIntPipe()) id: number,
  ): Promise<DataResponseDto> {
    return this.bannerService.changeStatus(id);
  }

  //delete a banner.
  @Delete(":id")
  @Roles(Role.Seller, Role.Admin)
  @UseGuards(AuthGuard)
  @ApiOkResponse({ type: Banner })
  @ApiParam({ name: "id", required: true })
  @ApiBearerAuth()
  delete(
    @RRole() role: string,
    @StoreId() storeId: number,
    @Param("id", new ParseIntPipe()) id: number,
  ): Promise<DataResponseDto> {
    return this.bannerService.delete(id, storeId, role);
  }
}
