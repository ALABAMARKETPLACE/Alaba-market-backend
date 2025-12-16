import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import { ProductVariantService } from "./productvariant.service";
import { ProductVariantDto } from "./dto/productvariant.dto";
import {
  AddNewProductVariantDto,
} from "./dto/createProductVariant.dto";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { ApiDataArrayResponse } from "../shared/decorator/dto-dataArray.decorator";

@Controller("productvariant")
@ApiTags("productvariant")
export class ProductVariantController {
  constructor(private readonly productvariantService: ProductVariantService) {}

  @Post("add_variants")
  @ApiDataArrayResponse(ProductVariantDto)
  @HttpCode(201)
  @ApiBearerAuth()
  create(
    @Body() { data, name, productId }: AddNewProductVariantDto
  ): Promise<DataResponseDto> {
    return this.productvariantService.addNewVariants(productId, name, data);
  }
  @Delete("delete/:id")
  @ApiOkResponse({ type: ProductVariantDto })
  @ApiParam({ name: "id", required: true })
  @ApiBearerAuth()
  delete(
    @Param("id", new ParseIntPipe()) id: number
  ): Promise<DataResponseDto> {
    return this.productvariantService.deleteVariant(id);
  }
}
