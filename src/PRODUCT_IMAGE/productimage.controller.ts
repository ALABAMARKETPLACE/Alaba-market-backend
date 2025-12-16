import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Put,
  UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ProductImageService } from "./productimage.service";
import { Roles } from "../shared/decorator/roles.decorator";
import { Role } from "../shared/enum/role.enum";
import { AuthGuard } from "../shared/guards/auth.guard";
import { UpdateProductImageDto2 } from "./dto/updateProductImage.dto";

@Controller("productimage")
@ApiTags("productimage")
export class ProductImageController {
  constructor(private readonly productimageService: ProductImageService) {}

  @Roles(Role.Seller)
  @UseGuards(AuthGuard)
  @Put("update/:id")
  updateImage(
    @Param("id", new ParseIntPipe()) id: number,
    @Body() data: UpdateProductImageDto2
  ) {
    return this.productimageService.updateImage(id, data);
  }
}
