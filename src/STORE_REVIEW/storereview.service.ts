import {
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException
} from "@nestjs/common";
import { Sequelize } from "sequelize";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { getErrorMessage } from "../shared/helpers/errormessage";
import { CreateStoreReviewDto } from "./dto/createStoreReview.dto";
import { StoreReview } from "./storereview.entity";

@Injectable()
export class StoreReviewService {
  constructor(
    @Inject("StoreReviewRepository")
    private readonly StoreReviewRepository: typeof StoreReview
  ) {}

  async create(
    userId: number,
    { orderId, rating, remark }: CreateStoreReviewDto
  ) {
    try {
      const [newone, created] = await this.StoreReviewRepository.findOrCreate({
        where: { userId, orderId },
        defaults: {
          rating,
          remark,
          userId: Sequelize.literal(`
            (CASE WHEN ${userId} = (SELECT "userId" FROM "ORDER" WHERE "id" = ${orderId})
            THEN ${userId} ELSE 0 END)`),
          orderId,
          storeId: Sequelize.literal(
            `(SELECT "storeId" from "ORDER" WHERE "id" = ${orderId})`
          ),
        },
      });
      if (created == false) {
        newone.rating = rating;
        newone.remark = remark;
        await newone.save();
      }
      const message = `Review ${created ? "Added" : "Updated"} successfully`;
      return new DataResponseDto(newone, true, message);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }
}
