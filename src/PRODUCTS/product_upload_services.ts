import {
  BadRequestException,
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { Products } from "./products.entity";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { getErrorMessage } from "../shared/helpers/errormessage";
import { UploadProductsDto } from "./dto/upload_products.dto";
import generateRandomString from "../shared/helpers/generateRandom";
import AWS from "aws-sdk";
const readXlsxFile = require("read-excel-file/node");
const sharp = require("sharp");

@Injectable()
export class ProductUploadService {
  private s3: AWS.S3;

  constructor(
    @Inject("Slugify") private readonly slugify: (slug: string) => string,
    @Inject("ProductsRepository") productRepository: typeof Products
  ) {
    this.s3 = new AWS.S3({
      accessKeyId: process.env.ACCESSKEYID,
      secretAccessKey: process.env.SECRETKEYID,
      region: process.env.REGION,
    });
  }
  async uploadProducts(
    storeId: number,
    file: Express.Multer.File,
    body: UploadProductsDto
  ) {
    try {
      let arrays = [];
      await readXlsxFile(file.buffer).then((rows: any) => {
        arrays = rows;
      });
      const newArray = [];
      for (const item of arrays) {
        const [, bar_code, name, unit, retail_rate, image, brand] = item;
        if (
          bar_code &&
          name &&
          isNaN(unit) == false &&
          isNaN(retail_rate) == false
        ) {
          newArray.push({
            bar_code: bar_code?.trim(),
            name,
            unit,
            retail_rate,
            image: image
              ? image
              : "https://bairuha-bucket.s3.ap-south-1.amazonaws.com/nextmiddleeast/logo.png",
            sku: generateRandomString(11),
            brand: brand ? brand : "Alaba Marketplace",
            bulk_order: false,
            category: body.category,
            description: name,
            manufacture: brand ? brand : "Alaba Marketplace",
            purchase_rate: retail_rate,
            status: true,
            subCategory: body.subCategory,
            title: name,
            units: unit,
            store_id: storeId,
            price: retail_rate,
            slug: this.slugify(name),
          });
        }
      }
      if (newArray?.length == 0) {
        throw new BadRequestException("Invalid File type .. please check");
      }
      return this.addProduct(newArray);
    } catch (err) {
      if (err instanceof HttpException)
        throw new InternalServerErrorException(getErrorMessage(err));
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }
  async addProduct(data: any[]) {
    try {
      const newP = await Products.bulkCreate(data, { returning: true });
      return new DataResponseDto({}, true, "Successfully uploaded");
    } catch (err) {
      return new DataResponseDto({}, false, getErrorMessage(err));
    }
  }
  async uploadImages(files: Array<Express.Multer.File>) {
    try {
      const uploaded = [];
      for (const item of files) {
        const { Location: url, Key } = await this.compressImage(item);
        uploaded.push({ url, Key });
      }
      return new DataResponseDto(uploaded, true, "Successfull");
    } catch (err) {
      return new DataResponseDto({}, false, getErrorMessage(err));
    }
  }
  async compressImage(file: Express.Multer.File) {
    try {
      const outputSharp = sharp(file.buffer);
      if (file.mimetype == "image/png") {
        outputSharp.png({ compressionLevel: 9 });
      } else {
        outputSharp.webp({ quality: 80 });
      }
      const compressedImageInfo = await outputSharp
        .resize(1000, 1000)
        .toBuffer();
      const params = {
        Bucket: process.env.BUCKET_NAME,
        Key: `${process.env.DIRECTORY}/${this.extractFileName(file?.originalname)}.${
          file.mimetype == "image/png" ? "png" : "webp"
        }`,
        Body: compressedImageInfo,
        ACL: "public-read",
      };
      const data = await this.s3.upload(params).promise();
      return data;
    } catch (err) {
      console.log(err);
    }
  }
  extractFileName(originalName: string) {
    const baseName =
      originalName.substring(0, originalName.lastIndexOf(".")) || originalName;

    const cleanFileName = baseName.replace(/[^a-zA-Z0-9_]/g, "");

    return cleanFileName;
  }
}
