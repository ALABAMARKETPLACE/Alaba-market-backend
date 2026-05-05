import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  HttpCode,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
  UploadedFiles,
  Res,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";

import { CheckSameStoreDto, ProductsDto } from "./dto/products.dto";
import { ProductsService } from "./products.services";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { ProductsPayloadDto } from "./dto/productsPayload.dto";
import { ProductsByStoreDto } from "./dto/productsByStore.dto";
import { PublicProductsQueryDto } from "./dto/public-products-query.dto";
import { ApiPaginatedResponse } from "../shared/decorator/dto-paginated.decorator";
import { ApiDataObjectResponse } from "../shared/decorator/dto-dataObject.decorator";
import { UpdateProductsDto } from "./dto/updateProduct.dto";
import { UpdateProductImagePayloadDto } from "./dto/updateProductImage.dto";
import { UpdateProductStatusDto } from "./dto/updateProductStatus.dto";
import { Roles } from "../shared/decorator/roles.decorator";
import { Role } from "../shared/enum/role.enum";
import { AuthGuard } from "../shared/guards/auth.guard";
import { UpdateProductVariantDto } from "./dto/updateVariant.dto";
import { StoreId } from "../shared/decorator/storeId_decorator";
import { UpdateCoverImage } from "./dto/updateCoverImage";
import { ProductUploadService } from "./product_upload_services";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { UploadProductsDto } from "./dto/upload_products.dto";
import { Response } from "express";

@Controller("products")
@ApiTags("products")
export class ProductsController {
  constructor(
    private readonly ProductsService: ProductsService,
    private readonly productUploadService: ProductUploadService
  ) {}

  @Get()
  @ApiOperation({ summary: "Public paginated product listing" })
  @ApiPaginatedResponse(ProductsDto)
  @UsePipes(new ValidationPipe({ transform: true }))
  findPublicProducts(
    @Query() pageOpt: PublicProductsQueryDto
  ): Promise<DataResponseDto> {
    return this.ProductsService.findPublicProducts(pageOpt);
  }

  //all products in a store
  @Roles(Role.Seller, Role.Admin)
  @UseGuards(AuthGuard)
  @Get("bystore")
  @ApiBearerAuth()
  @ApiPaginatedResponse(ProductsDto)
  @UsePipes(new ValidationPipe({ transform: true }))
  findByStoreId(
    @StoreId() storeId: number,
    @Query() pageOpt: ProductsByStoreDto,
    @Res() res: Response
  ) {
    const queryParams = new URLSearchParams({
      storeId: String(storeId),
      ...(pageOpt?.query && { query: pageOpt.query }),
      ...(pageOpt?.subCategory && {
        subCategory: String(pageOpt?.subCategory),
      }),
      ...(pageOpt?.page && { page: String(pageOpt.page) }),
      ...(pageOpt?.take && { take: String(pageOpt.take) }),
      ...(pageOpt?.instock && { instock: String(pageOpt.instock) }),
      ...(pageOpt?.category && { category: String(pageOpt.category) }),
      ...(pageOpt?.status && { status: pageOpt.status }),
      order: "DESC",
    }).toString();
    const URL =
      "/product_search/single" + (queryParams ? `?${queryParams}` : "");
    res.redirect(URL);
  }

  //to get all products in a store only for admin
  // @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Get("bystore/:id")
  @ApiBearerAuth()
  @ApiParam({ name: "id", required: true })
  @ApiPaginatedResponse(ProductsDto)
  @UsePipes(new ValidationPipe({ transform: true }))
  findByStore(
    @Query() pageOpt: ProductsByStoreDto,
    @Res() res: Response,
    @Param("id", new ParseIntPipe()) storeId: number
  ) {
    const queryParams = new URLSearchParams({
      storeId: String(storeId),
      ...(pageOpt?.query && { query: pageOpt.query }),
      ...(pageOpt?.subCategory && {
        subCategory: String(pageOpt?.subCategory),
      }),
      ...(pageOpt?.page && { page: String(pageOpt.page) }),
      ...(pageOpt?.take && { take: String(pageOpt.take) }),
      ...(pageOpt?.instock && { instock: String(pageOpt.instock) }),
      ...(pageOpt?.category && { category: String(pageOpt.category) }),
      ...(pageOpt?.status && { status: pageOpt.status }),
      order: "DESC",
    }).toString();
    const URL =
      "/product_search/single" + (queryParams ? `?${queryParams}` : "");
    res.redirect(URL);
  }

  //to get product details for seller only editin
  @Roles(Role.Seller, Role.Admin)
  @UseGuards(AuthGuard)
  @Get("seller/:id")
  @ApiBearerAuth()
  @ApiParam({ name: "id", required: true })
  @ApiDataObjectResponse(ProductsDto)
  findProductSeller(
    @StoreId() storeId: number,
    @Param("id", ParseIntPipe) id: number
  ): Promise<DataResponseDto> {
    return this.ProductsService.findOneForSeller(storeId, id);
  }

  //add a new product
  @Roles(Role.Seller, Role.Admin)
  @UseGuards(AuthGuard)
  @Post("create")
  @ApiBearerAuth()
  @ApiDataObjectResponse(ProductsDto)
  @HttpCode(201)
  create(
    @StoreId() storeId: number,
    @Body() createProductsDto: ProductsPayloadDto,
    @Req() req
  ): Promise<DataResponseDto> {
    console.log("raw req.body:", req.body);
    console.log("mapped DTO:", createProductsDto);
    return this.ProductsService.create(storeId, createProductsDto);
  }

  @Roles(Role.Seller, Role.Admin)
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor("file"))
  @UsePipes(new ValidationPipe({ transform: true }))
  @Post("upload/")
  @ApiBearerAuth()
  uploadProducts(
    @Body() body: UploadProductsDto,
    @StoreId() storeId: number,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5000000 }),
          new FileTypeValidator({
            fileType:
              /^(application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet|application\/vnd\.ms-excel)$/,
          }),
        ],
      })
    )
    file: Express.Multer.File
  ): Promise<any> {
    return this.productUploadService.uploadProducts(storeId, file, body);
  }

  @Roles(Role.Seller, Role.Admin)
  @UseGuards(AuthGuard)
  @Post("upload/files")
  @UseInterceptors(FilesInterceptor("files"))
  uploadFiles(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 2000000 }),
          new FileTypeValidator({ fileType: /(jpe?g|png|webp)$/i }),
        ],
      })
    )
    files: Array<Express.Multer.File>
  ) {
    return this.productUploadService.uploadImages(files);
  }

  //update a product details
  @Roles(Role.Seller, Role.Admin)
  @UseGuards(AuthGuard)
  @Put("update/:id")
  @ApiParam({ name: "id", required: true })
  @ApiBearerAuth()
  @ApiDataObjectResponse(ProductsDto)
  @HttpCode(202)
  update(
    @StoreId() StoreId: number,
    @Param("id", new ParseIntPipe()) id: number,
    @Body() updateProduct: UpdateProductsDto
  ): Promise<DataResponseDto> {
    return this.ProductsService.updateProductDetails(
      StoreId,
      id,
      updateProduct
    );
  }

  //add or remove product images.
  @Roles(Role.Seller, Role.Admin)
  @UseGuards(AuthGuard)
  @Put("update_image/:id")
  @ApiParam({ name: "id", required: true })
  @ApiBearerAuth()
  @ApiDataObjectResponse(ProductsDto)
  @HttpCode(200)
  updateProductImage(
    @StoreId() storeId: number,
    @Param("id", new ParseIntPipe()) id: number,
    @Body() updateProductImg: UpdateProductImagePayloadDto
  ): Promise<DataResponseDto> {
    return this.ProductsService.updateProductImages(
      storeId,
      id,
      updateProductImg
    );
  }

  //add or remove product images.
  @Roles(Role.Seller, Role.Admin)
  @UseGuards(AuthGuard)
  @Put("update_cover_img/:id")
  @ApiParam({ name: "id", required: true })
  @ApiBearerAuth()
  @ApiDataObjectResponse(ProductsDto)
  @HttpCode(200)
  updateCoverImg(
    @StoreId() storeId: number,
    @Param("id", new ParseIntPipe()) id: number,
    @Body() updateProductImg: UpdateCoverImage
  ): Promise<DataResponseDto> {
    return this.ProductsService.updateCoverImage(id, storeId, updateProductImg);
  }

  //to activate or deactivate product
  @Roles(Role.Seller, Role.Admin)
  @UseGuards(AuthGuard)
  @Put("update_status/:id")
  @ApiParam({ name: "id", required: true })
  @ApiBearerAuth()
  @ApiDataObjectResponse(ProductsDto)
  @HttpCode(200)
  updateProductStatus(
    @StoreId() storeId: number,
    @Param("id", new ParseIntPipe()) id: number,
    @Body() updateStatus: UpdateProductStatusDto
  ): Promise<DataResponseDto> {
    return this.ProductsService.updateProductStatus(storeId, id, updateStatus);
  }

  //to update product variants.
  @Roles(Role.Seller, Role.Admin)
  @UseGuards(AuthGuard)
  @Put("update/variant/:id")
  @ApiParam({ name: "id", required: true })
  @ApiBearerAuth()
  @ApiDataObjectResponse(ProductsDto)
  @HttpCode(200)
  updateVariant(
    @StoreId() storeId: number,
    @Param("id", new ParseIntPipe()) id: number,
    @Body() updateProduct: UpdateProductVariantDto
  ): Promise<any> {
    return this.ProductsService.updateProductVariant(
      storeId,
      id,
      updateProduct
    );
  }

  @Roles(Role.Seller, Role.Admin)
  @UseGuards(AuthGuard)
  @Delete("delete/:id")
  delete(
    @Req() req: any,
    @Param("id", ParseIntPipe) id: number,
    @Body("storeId") storeIdFromBody?: number
  ): Promise<DataResponseDto> {
    const user = req.user;

    const storeId =
      user.role === Role.Admin
        ? storeIdFromBody // admin may specify
        : user.storeId;   // seller forced to their own store

    return this.ProductsService.delete(storeId, id, user.role);
  }

  @Roles(Role.Seller, Role.Admin)
  @UseGuards(AuthGuard)
  @Delete("delete_image/:id")
  @ApiParam({ name: "id", required: true })
  @ApiBearerAuth()
  @ApiDataObjectResponse(ProductsDto)
  @HttpCode(200)
  deleteImage(
    @StoreId() storeId: number,
    @Param("id", new ParseIntPipe()) id: number
  ): Promise<DataResponseDto> {
    return this.ProductsService.deleteImage(id);
  }

  @Post('check-same-store')
  @HttpCode(200)
  @ApiOperation({ summary: 'Check if products belong to the same store' })
  @ApiResponse({
    status: 200,
    description: 'Returns the result of the same store check',
    type: DataResponseDto,
  })
  async checkSameStore(@Body() body: CheckSameStoreDto): Promise<DataResponseDto> {
    return this.ProductsService.checkSameStore(body.pids);
  }
}
