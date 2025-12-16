import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { Op, Sequelize } from "sequelize";
import { Products } from "../PRODUCTS/products.entity";
import { ProductSearchStoreDto } from "./dto/product_search_store.dto";
import { Store } from "../STORE/store.entity";
import { getErrorMessage } from "../shared/helpers/errormessage";
import { ProductAttributes } from "./attributes";
import { SubCategory } from "../SUB_CATEGORY/sub_category.entity";
import { ProductSearchByCategory, ProductSearchItemByCategory } from "./dto/product_search_getall.dto";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { Settings } from "../SETTINGS/settings.entity";
@Injectable()
export class ProductSearchStoreService extends ProductAttributes {
  constructor(
    @Inject("Slugify") private readonly slugify: (slug: string) => string,
    @Inject("SettingsRepository")
    private readonly settingsRepository: typeof Settings
  ) {
    super();
  }
  async fetchProductsOnStore(slug: string, pageOptions: ProductSearchStoreDto) {
    const { take, page, category, subCategory, query, price, order } =
      pageOptions;
    const skip = (page - 1) * take;
    try {
      const { rows, count } = await Products.findAndCountAll({
        where: {
          status: true,
          ...(query && {
            slug: {
              [Op.like]: `%${this.slugify(query)}%`,
            },
          }),
          ...(category && { category }),
          ...(subCategory && { subCategory }),
        },
        attributes: [...this.productAttributes],
        order: this.productOrder(order, price),
        distinct: true,
        limit: take,
        offset: skip,
        include: [
          { model: Store, required: true, attributes: [], where: { slug } },
        ],
      });
      return new DataResponseDto(rows, true, "Successful", pageOptions, count);
    } catch (err) {
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async fetchByCategory(pageOptions: ProductSearchByCategory, slug: string) {
    try {
      const { page, take, order, price, query, productLimit } = pageOptions;
      const skip = (page - 1) * take;
      const { rows, count } = await SubCategory.findAndCountAll({
        where: {
          [Op.and]: [
            Sequelize.literal(`
                  EXISTS (
                    SELECT 1
                    FROM "PRODUCTS"
                    WHERE "PRODUCTS"."subCategory" = "SubCategory"."_id"
                      AND "status" = true AND "store_id" = (SELECT "id" FROM "STORE" WHERE "slug" = :slug ))
              `),
          ],
        },
        limit: take,
        offset: skip,
        replacements: { slug: slug, slug2: slug },
        order: [["createdAt", "ASC"]],
        attributes: this.subCategoryAttributes,
        include: [
          {
            model: Products,
            required: true,
            separate: true,
            limit: productLimit,
            order: this.productOrder(order, price),
            attributes: [...this.productAttributes],
            where: {
              status: true,
              store_id: Sequelize.literal(
                `"store_id" = (SELECT "id" FROM "STORE" WHERE "slug" = :slug2 )`
              ),
              ...(query && { slug: { [Op.like]: `%${this.slugify(query)}%` } }),
            },
          },
        ],
      });
      return new DataResponseDto(rows, true, "Successful", pageOptions, count);
    } catch (err) {
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async fetchProductByCategory(pageOptions: ProductSearchItemByCategory) {
    try {
      console.log("pageOptions", pageOptions);
      const {
        page,
        take,
        order,
        price,
        query,
        productLimit,
        lattitude,
        longitude,
        category,
      } = pageOptions;
      const skip = (page - 1) * take;
      const attributes: any[] = [
        "id",
        "name",
        "store_name",
        "logo_upload",
        "code",
        "phone",
        "business_types",
        "cover_image",
        "averageRating",
        "ratings",
        "slug",
        "business_address",
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
      ];
      const settings = await this.settingsRepository.findByPk(1);
      const radius = settings?.radius || 100;
      const store = await Store.findOne({
        attributes,
        ...(lattitude && longitude
          ? {
              where: Sequelize.literal(
                `HaversineDistance(${lattitude}, ${longitude}, lat, long) <= ${radius}`
              ),
            }
          : {}),
      });
      const plainStore = store?.get({ plain: true });
      if (!store) throw new NotFoundException();
      const { rows,count } = await Products.findAndCountAll({
        where: {
          status: true,
          store_id: Sequelize.literal(
            `"store_id" = (SELECT "id" FROM "STORE" WHERE "slug" = :slug )`
          ),
          category: category,
          ...(query && { slug: { [Op.like]: `%${this.slugify(query)}%` } }),
        },
        limit: take,
        offset: skip,
        replacements: { slug: plainStore?.slug },
        order: this.productOrder(order, price),
        attributes: [...this.productAttributes],
      });
      // const { rows, count } = await SubCategory.findAndCountAll({
      //   where: {
      //     [Op.and]: [
      //       Sequelize.literal(`
      //             EXISTS (
      //               SELECT 1
      //               FROM "PRODUCTS"
      //               WHERE "PRODUCTS"."subCategory" = "SubCategory"."_id"
      //                 AND "status" = true AND "store_id" = (SELECT "id" FROM "STORE" WHERE "slug" = :slug )AND "PRODUCTS"."category" = :category)
      //         `),
      //     ],
      //   },
      //   limit: take,
      //   offset: skip,
      //   replacements: { slug: plainStore?.slug, slug2: plainStore?.slug, category: category},
      //   order: [["createdAt", "ASC"]],
      //   attributes: this.subCategoryAttributes,
      //   include: [
      //     {
      //       model: Products,
      //       required: true,
      //       separate: true,
      //       limit: productLimit,
      //       order: this.productOrder(order, price),
      //       attributes: [...this.productAttributes],
      //       where: {
      //         status: true,
      //         store_id: Sequelize.literal(
      //           `"store_id" = (SELECT "id" FROM "STORE" WHERE "slug" = :slug2 )`
      //         ),
      //         ...(query && { slug: { [Op.like]: `%${this.slugify(query)}%` } }),
      //       },
      //     },
      //   ],
      // });
      return new DataResponseDto(rows, true, "Successful", pageOptions, count);
    } catch (err) {
      console.log('this is the error',err)
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }
}
