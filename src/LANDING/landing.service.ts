import { HttpException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { Banner } from "../BANNER/banner.entity";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { LandingBannerDto } from "./dto/banner.dto";
import { Store } from "../STORE/store.entity";
import { Op, Sequelize } from "sequelize";
import { getErrorMessage } from "../shared/helpers/errormessage";
@Injectable()
export class LandingService {
  
  async findBanners(latlong: LandingBannerDto) {
    const { lat, long, radius } = latlong;
    let whereCondition: any = { status: true };
    if (lat && long) {
      whereCondition = {
        [Op.or]: [
          { status: true },
          Sequelize.literal(
            `HaversineDistance(${lat}, ${long}, "storeDetails"."lat", "storeDetails"."long") <= ${radius}`
          ),
        ],
      };
    }
    try {
      const banners: Banner[] = await Banner.findAll({
        where: whereCondition,
        include: [
          {
            model: Store,
            required: true,
            attributes: ["store_name"],
          },
        ],
      });
      return new DataResponseDto(banners, true, "Success");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }
}
