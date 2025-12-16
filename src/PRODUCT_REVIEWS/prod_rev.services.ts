import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { ProductReviews } from "./prod_rev.entity";
import { CreateProductReviewsDto } from "./dto/create.dto";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { PageOptionsDtoReview } from "./dto/pageOptionReview.dto";
import { getErrorMessage } from "../shared/helpers/errormessage";
import { Sequelize } from "sequelize";
import { User } from "../USERS/user.entity";
import { escape } from "querystring";
import { Products } from "../PRODUCTS/products.entity";
@Injectable()
export class ProductReviewsService {
  constructor(
    @Inject("ProductReviewsRepository")
    private readonly ProductReviewsRepository: typeof ProductReviews
  ) {}

  async findAll(pageOptionsDto: PageOptionsDtoReview, userId: number) {
    const skip = (pageOptionsDto.page - 1) * pageOptionsDto.take;
    const order: any[] = [
      ...(userId
        ? [
            [
              Sequelize.literal(`CASE WHEN "user_id" = ? THEN 0 ELSE 1 END`),
              "ASC",
            ],
          ]
        : []),
      ["createdAt", "DESC"],
    ];
    try {
      const { rows, count } =
        await this.ProductReviewsRepository.findAndCountAll<ProductReviews>({
          attributes: {
            exclude: ["updatedAt", "product_id"],
            include: [[Sequelize.col("userDetails.name"), "userName"]],
          },
          limit: pageOptionsDto.take,
          offset: skip,
          order,
          include: [
            {
              model: User,
              required: true,
              attributes: [],
            },
            {
              model: Products,
              required: true,
              attributes: [],
              where: { pid: pageOptionsDto.productId },
            },
          ],
          replacements: [userId],
        });
      return new DataResponseDto(rows, true, "Success", pageOptionsDto, count);
    } catch (err) {
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async create(UserId: number, create: CreateProductReviewsDto) {
    try {
      const newReview = await this.ProductReviewsRepository.create({
        product_id: Sequelize.literal(
          `(SELECT "_id" FROM "PRODUCTS" WHERE "pid" = '${escape(
            create.product_id
          )}')`
        ),
        user_id: UserId,
        message: create.message,
        rating: create.rating,
      });
      return new DataResponseDto(newReview, true, "Successfully created");
    } catch (err) {
      if (err.name == "SequelizeUniqueConstraintError")
        throw new ConflictException(
          "You've already posted Review for this product"
        );
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async delete(user_id: number, _id: number) {
    try {
      const deleted = await this.ProductReviewsRepository.destroy({
        where: {
          _id,
          user_id,
        },
      });
      if (deleted == 0) throw new NotFoundException();
      return new DataResponseDto(deleted, true, "Successfully deleted");
    } catch (err) {
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }
}
