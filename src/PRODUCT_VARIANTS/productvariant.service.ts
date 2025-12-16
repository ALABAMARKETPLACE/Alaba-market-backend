import {
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { ProductVariant } from "./productvariant.entity";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { CreateProductVariantDto } from "./dto/createProductVariant.dto";
import { Products } from "../PRODUCTS/products.entity";
import { Transaction } from "sequelize";
import { getErrorMessage } from "../shared/helpers/errormessage";

@Injectable()
export class ProductVariantService {
  constructor(
    @Inject("ProductVariantRepository")
    private readonly ProductVariantRepository: typeof ProductVariant
  ) {}

  async create(
    product: Products,
    variant: CreateProductVariantDto[],
    transaction: Transaction
  ) {
    if (Array.isArray(variant) == false) return [];
    if (product?._id == null) return [];
    if (variant.length == 0) return [];
    else {
      try {
        let totalUnits = 0;
        const newVariants = [];
        for (const item of variant) {
          const imageUrl =
            typeof item?.image == "string"
              ? item.image
              : typeof item?.image?.url == "string"
              ? item?.image?.url
              : typeof item?.image?.url?.url == "string"
              ? item?.image?.url?.url
              : "";
          const varie = await this.ProductVariantRepository.create(
            {
              name: product.name,
              productId: product._id,
              barcode: item.barcode,
              image: imageUrl,
              price: Number(item.price),
              sku: item.sku,
              units: Number(item.units),
              combination: item.combination,
            },
            { transaction: transaction }
          );
          totalUnits += varie.units;
          newVariants.push(varie);
        }
        return { newVariants, totalUnits };
      } catch (err) {
        console.log(err)
        throw new Error("Failed to Add Variants,@@" + getErrorMessage(err));
      }
    }
  }
  async addNewVariants(
    productId: number,
    name: string,
    variant: CreateProductVariantDto[]
  ) {
    if (Array.isArray(variant) == false)
      return new DataResponseDto([], false, "Invalid Input, Please try again.");
    if (productId == null)
      return new DataResponseDto([], false, "Invalid Product Id found.");
    if (variant.length == 0)
      return new DataResponseDto([], false, "No Variants are found to add.");
    else {
      try {
        const newVar = [];
        for (const item of variant) {
          const varie = await this.ProductVariantRepository.create({
            name: name,
            productId: Number(productId),
            available: item.available,
            barcode: item.barcode,
            image: item.image?.url?.url,
            price: Number(item.price),
            sku: item.sku,
            units: Number(item.units),
            combination: item.combination,
          });
          newVar.push(varie);
        }
        return new DataResponseDto(newVar, true, "Successfully Added");
      } catch (err) {
        if (err instanceof HttpException) throw err;
        throw new InternalServerErrorException(getErrorMessage(err));
      }
    }
  }
  async deleteVariant(id: number) {
    try {
      const deleted = await this.ProductVariantRepository.destroy({
        where: {
          id: id,
        },
      });
      return new DataResponseDto({}, true, "Variant Deleted Successfully");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }
}
