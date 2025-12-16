import {
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { UserHistory } from "./userhistory.entity";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { getErrorMessage } from "../shared/helpers/errormessage";
import { Products } from "../PRODUCTS/products.entity";
import { Sequelize } from "sequelize";
import { PageOptionsDto } from "../shared/dto/pageOptions.dto";
import { ProductVariant } from "../PRODUCT_VARIANTS/productvariant.entity";
@Injectable()
export class UserHistoryService {
  constructor(
    @Inject("UserHistoryRepository")
    private readonly UserHistoryRepository: typeof UserHistory
  ) {}

  async findAll(userId: number, pageOptionsDto: PageOptionsDto) {
    try {
      const skip = (pageOptionsDto.page - 1) * pageOptionsDto.take;
      const { rows, count } = await this.UserHistoryRepository.findAndCountAll({
        where: { userId },
        order: [["updatedAt", "DESC"]],
        offset: skip,
        limit: pageOptionsDto.take,
        attributes: [
          "updatedAt",
          [Sequelize.col("productDetails.slug"), "slug"],
          [Sequelize.col("productDetails._id"), "_id"],
          [Sequelize.col("productDetails.name"), "name"],
          [Sequelize.col("productDetails.image"), "image"],
          [Sequelize.col("productDetails.category"), "category"],
          [Sequelize.col("productDetails.description"), "description"],
          [Sequelize.col("productDetails.purchase_rate"), "purchase_rate"],
          [Sequelize.col("productDetails.retail_rate"), "retail_rate"],
          [Sequelize.col("productDetails.status"), "status"],
          [Sequelize.col("productDetails.subCategory"), "subCategory"],
          [Sequelize.col("productDetails.title"), "title"],
          [Sequelize.col("productDetails.unit"), "unit"],
          [Sequelize.col("productDetails.units"), "units"],
          [Sequelize.col("productDetails.price"), "price"],
          [Sequelize.col("productDetails.pid"), "pid"],
          [Sequelize.col("productDetails.averageRating"), "averageRating"],
          [Sequelize.col("productDetails.totalReviews"), "totalReviews"],
          // [
          //   Sequelize.col("productDetails.productDetails.productVariant"),
          //   "productVariant",
          // ],
        ],
        include: [
          {
            model: Products,
            required: true,
            attributes: ["_id"],
            include: [
              {
                model: ProductVariant,
                required: false,
                attributes: ["price", "id", "image"],
              },
            ],
          },
        ],
      });
      const results = rows.map((row) => ({
        ...row.toJSON(),
        productDetails:undefined,
        productVariant: row?.productDetails?.productVariant, // Flattening the structure
      }));
      return new DataResponseDto(results, true, "Success", pageOptionsDto, count);
    } catch (err) {
      console.log(err);
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }
}
