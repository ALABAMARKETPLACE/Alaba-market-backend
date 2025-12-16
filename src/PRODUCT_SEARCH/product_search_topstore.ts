import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { Op, Sequelize } from "sequelize";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { getErrorMessage } from "../shared/helpers/errormessage";
import { Store } from "../STORE/store.entity";
import { ProductAttributes } from "./attributes";
import { TopSellingStoresDto } from "./dto/top_stores.dto";
@Injectable()
export class TopStoreService extends ProductAttributes {
  async getTopStores(
    pageOptionsDto: TopSellingStoresDto,
    // defaultStore: boolean = true
  ) {
    const { lattitude, longitude, take, radius } = pageOptionsDto;
    let defaultStoreId = null;
    try {
      //==============================================================================default
      // if (defaultStore === true && lattitude && longitude && radius) {
      //   //to check if any stores are available in user's location
      //   defaultStoreId = await this.getDefaultStoreId(
      //     lattitude,
      //     longitude,
      //     radius
      //   );
      //   console.log("defaultStoreId===>",defaultStoreId);
      // }
      //==============================================================================default

      const topStore = await Store.findAll({
        limit: take,
        order: [["order_count", "DESC"]],
        where: {
          [Op.or]: [
            { default: true },
            {
          [Op.and]: [
            { status: "approved" },
            ...(lattitude && longitude && radius
              // && defaultStoreId == null
              ? [Sequelize.literal(`HaversineDistance(?, ?, lat, long) <= ?`)]
              : []),
           // ...(defaultStoreId ? [{ id: defaultStoreId }] : []),
          ]
        }
        ]
        },
        replacements: [lattitude, longitude, radius],
        attributes: [
          ...this.storeAttributes,
          ...(lattitude && longitude 
            //&& defaultStore == false
            ? this.storeIncludeDistance(lattitude, longitude)
            : []),
        ],
      });
      // if (topStore?.length == 0 && defaultStore === false)
      //   return this.getTopStores(pageOptionsDto, true);
      return new DataResponseDto(topStore, true, "successfully fetched");
    } catch (err) {
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }
  async getPrintStore(
    pageOptionsDto: TopSellingStoresDto,
    // defaultStore: boolean = true
  ) {
    const { lattitude, longitude, take, radius } = pageOptionsDto;
    let defaultStoreId = null;
    try {

      const topStore = await Store.findAll({
        limit: take,
        order: [["order_count", "DESC"]],
        where: {
          [Op.or]: [
            { default: true },
            {
          [Op.and]: [
            { status: "approved" },
            ...(lattitude && longitude && radius
              ? [Sequelize.literal(`HaversineDistance(?, ?, lat, long) <= ?`)]
              : []),
          ]
        }
        ],
        is_prind_available:true
        },
        replacements: [lattitude, longitude, radius],
        attributes: [
          ...this.storeAttributes,
          ...(lattitude && longitude 
            //&& defaultStore == false
            ? this.storeIncludeDistance(lattitude, longitude)
            : []),
        ],
      });
      return new DataResponseDto(topStore, true, "successfully fetched");
    } catch (err) {
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }
}
