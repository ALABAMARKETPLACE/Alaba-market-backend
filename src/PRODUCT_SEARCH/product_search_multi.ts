import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { ProductSearchMultiDto } from "./dto/productSearchMultiDto";
import { Store } from "../STORE/store.entity";
import { Op, Sequelize } from "sequelize";
import { Products } from "../PRODUCTS/products.entity";
import { getErrorMessage } from "../shared/helpers/errormessage";
import { ProductAttributes } from "./attributes";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { ProductVariant } from "../PRODUCT_VARIANTS/productvariant.entity";

@Injectable()
export class ProductSearchServiceMulti extends ProductAttributes {
  constructor(
    @Inject("Slugify") private readonly slugify: (slug: string) => string
  ) {
    super();
  }
  async fetchProductsMulti(
    pageOptions: ProductSearchMultiDto,
    defaultStore = false
  ) {
    let defaultStoreId = null;
    const {
      storeId,
      page,
      take,
      productLimit,
      order,
      category,
      subCategory,
      query,
      lattitude,
      longitude,
      radius,
      price,
      tag,
    } = pageOptions;
    const skip = (page - 1) * take;
    try {
      //==============================================================================default
      if (defaultStore === true && lattitude && longitude && radius) {
        //to check if any stores are available in user's location
        defaultStoreId = await this.getDefaultStoreId(
          lattitude,
          longitude,
          radius
        );
      }
      //==============================================================================default
      const { rows, count } = await Store.findAndCountAll({
        attributes: [
          ...this.storeAttributes,
          ...(lattitude && longitude
            ? [
                [
                  Sequelize.literal(
                    `HaversineDistance(${lattitude}, ${longitude}, lat, long)`
                  ),
                  "distance",
                ],
              ]
            : []),
        ],
        where: {
          [Op.and]: [
            { status: "approved" },
            ...(lattitude && longitude && defaultStoreId == null
              ? [Sequelize.literal(`HaversineDistance(?, ?, lat, long) <= ?`)]
              : []),
            ...(storeId && !defaultStoreId ? [{ id: storeId }] : []),
            ...(defaultStoreId ? [{ id: defaultStoreId }] : []),
            Sequelize.literal(`
                EXISTS (
                  SELECT 1
                  FROM "PRODUCTS"
                  WHERE "PRODUCTS"."store_id" = "Store"."id"
                    AND "PRODUCTS"."status" = true
                    ${
                      query
                        ? `AND ("PRODUCTS"."slug" LIKE '%${this.slugify(
                            query
                          )}%')`
                        : ""
                    }
                    ${
                      subCategory
                        ? `AND ("PRODUCTS"."subCategory" = ${subCategory})`
                        : ""
                    }
                    ${
                      category
                        ? `AND ("PRODUCTS"."category" = ${category})`
                        : ""
                    }
                    
                )
            `),
          ],
        },
        replacements: [lattitude, longitude, radius],
        limit: take,
        offset: skip,
        order: [["order_count", "DESC"]],
        include: [
          {
            model: Products,
            required: true,
            separate: true,
            limit: productLimit,
            order: this.productOrder(order, price, tag),
            where: {
              status: true,
              ...(query && { slug: { [Op.like]: `%${this.slugify(query)}%` } }),
              ...(category && { category }),
              ...(subCategory && { subCategory }),
            },
            attributes: [...this.productAttributes],
          },
        ],
      });
      if (count == 0 && defaultStore === false)
        return this.fetchProductsMulti(pageOptions, true);
      return new DataResponseDto(rows, true, "Successful", pageOptions, count);
    } catch (err) {
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }
}
