import { createStructuredLogger } from "../shared/logger/structured-logger";
import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { ProductImage } from "./productimage.entity";
import {
  CreateProductImageDto,
  UpdateProductImageDto,
} from "./dto/createProductImage.dto";
import { Products } from "../PRODUCTS/products.entity";
import { Transaction, where } from "sequelize";
import { ImgcompressService } from "../IMAGE_COMPRESS/img_compress.service";
import { getErrorMessage } from "../shared/helpers/errormessage";
import { UpdateProductImageDto2 } from "./dto/updateProductImage.dto";
import { NotFoundError } from "rxjs";
import { DataResponseDto } from "../shared/dto/data-response-dto";

const appLog = createStructuredLogger("productimage_service");
const defaultImage =
  "https://bairuha-bucket.s3.ap-south-1.amazonaws.com/nextmiddleeast/no-image-icon-23485.png";
@Injectable()
export class ProductImageService {
  constructor(
    @Inject("ProductImageRepository")
    private readonly ProductImageRepository: typeof ProductImage,
    private readonly imageUploadService: ImgcompressService
  ) {}
  async create(
    product: Products,
    image: CreateProductImageDto[],
    transaction: Transaction
  ) {
    try {
      if (Array.isArray(image) != true) {
        throw new Error("No Images are selected.. Please try adding Images.@@");
      }
      const images = [];
      for (const item of image) {
        if (item?.url) {
          //only if url is found item.url can be a url or item.url.url can be a url
          const imageUrl =
            typeof item?.url == "string"
              ? item?.url
              : typeof item?.url?.url == "string"
              ? item?.url?.url
              : defaultImage;
          const img = await this.ProductImageRepository.create(
            {
              url: imageUrl,
              productId: product._id,
              type: "jpg/img",
              Key: item?.url?.Key,
            },
            {
              transaction: transaction,
            }
          );
          images.push(img);
        }
      }
      if (images?.length == 0) {
        //no product image is added
        // throw new Error("@@No Valid Images are Found..Please check");
      }
      return images;
    } catch (err) {
      throw new Error(getErrorMessage(err) + "@@");
    }
  }
  async updateProductImages(
    pId: number,
    newImages: CreateProductImageDto[],
    imgtoRemove: UpdateProductImageDto[],
    transaction: Transaction
  ) {
    try {
      const newImg = await this.addNewImages(pId, newImages, transaction);
      const removeImg = await this.removeImages(imgtoRemove, transaction);
      return { newImg, removeImg };
    } catch (err) {
      throw new Error("Unable to add or Remove Image@@");
    }
  }
  async addNewImages(
    pId: number,
    newImages: CreateProductImageDto[],
    t: Transaction
  ) {
    try {
      const images = [];
      if (Array.isArray(newImages) && pId) {
        //if the payload is an array and productId is found.
        for (const img of newImages) {
          if (img?.url?.url && img?.url?.Key) {
            //if url and key is found for each image.
            const newImg = await this.ProductImageRepository.create(
              {
                url: img.url?.url,
                productId: pId,
                type: "img/jpeg",
                Key: img.url?.url,
              },
              { transaction: t }
            );
            images.push(newImg);
          }
        }
        return images;
      }
      return [];
    } catch (err) {
      appLog.info(err);
      throw new Error("Failed to Add Product Image@@");
    }
  }
  async removeImages(removeImages: UpdateProductImageDto[], t: Transaction) {
    const images = [];
    try {
      if (Array.isArray(removeImages)) {
        //if the payload is an array
        for (const img of removeImages) {
          if (img.id && img.Key) {
            //first we remove file from s3 then remove from db
            // const removedS3 = await this.imageUploadService.deleteFromS3(
            //   img.Key
            // );
            const removed = await this.ProductImageRepository.destroy({
              where: {
                id: img.id,
              },
              transaction: t,
            });
            removed == 1 ? images.push(img) : null;
          }
        }
        return images;
      }
      return [];
    } catch (err) {
      throw new Error(getErrorMessage(err) + "@@");
    }
  }
  async updateImage(id: number, data: UpdateProductImageDto2) {
    try {
      const image = await this.ProductImageRepository.findByPk(id);
      if (!image) throw new NotFoundException();
      await image.update({ url: data.url });
      return new DataResponseDto(image, true, "Success");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException();
    }
  }
}
