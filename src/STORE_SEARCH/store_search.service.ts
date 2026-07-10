import { createStructuredLogger } from "../shared/logger/structured-logger";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { Op, Sequelize } from "sequelize";
import { HttpException, Inject, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { SubCategory } from "../SUB_CATEGORY/sub_category.entity";
import { Store } from "../STORE/store.entity";
import { Banner } from "../BANNER/banner.entity";
import { getErrorMessage } from "../shared/helpers/errormessage";
import { StoreLocationCategoryDto, StoreLocationDto } from "./dto/store_latlong.dto";
import { Settings } from "../SETTINGS/settings.entity";
import { Category } from "../CATEGORY/category.entity";

const appLog = createStructuredLogger("store_search_service");

const successMsg = "Products Successfully Fetched";
@Injectable()
export class StoreSearchServices {
  constructor(
    @Inject("SettingsRepository")
    private readonly settingsRepository: typeof Settings
  ) {}

  async getStoreDetails(slug: string, query: StoreLocationDto) {
    const { lattitude, longitude } = query;
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
    try {
      const store = await Store.findOne({
        where: { slug },
        attributes,
      });
      if (!store) throw new NotFoundException();
      const category = await this.getSubCategoriesByStoreId(store.id);
      const banners = await Banner.findAll({
        where: { storeId: store.id },
        attributes: {
          exclude: [
            "position",
            "createdAt",
            "updatedAt",
            "status",
            "img_mob",
            "storeId",
          ],
        },
      });
      return new DataResponseDto(
        { store, category, banners },
        true,
        successMsg
      );
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async getStoreInfo(storeId: number) {
    try {
      const store = await Store.findOne({
        where: { id: storeId },
        attributes: [
          "id",
          "name",
          "store_name",
          "logo_upload",
          "code",
          "phone",
          "business_type",
        ],
      });
      if (!store) throw new NotFoundException();
      const category = await this.getSubCategoriesByStoreId(store.id);
      return new DataResponseDto({ store, category }, true, successMsg);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async getBannerByStore(id: number) {
    try {
      const storeBanner = await Banner.findAll({
        where: {
          storeId: id,
        },
      });
      if (!storeBanner) throw new NotFoundException();
      return new DataResponseDto(storeBanner, true, successMsg);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }
  async getSubCategoriesByStoreId(storeId: number): Promise<SubCategory[]> {
    try {
      const subCategories = await SubCategory.findAll({
        attributes: ["_id", "name", "image", "description", "slug"],
        where: {
          _id: {
            [Op.in]: [
              SubCategory.sequelize.literal(
                `SELECT DISTINCT("subCategory") FROM public."PRODUCTS" WHERE "store_id" = ${storeId}`
              ),
            ],
          },
        },
      });
      return subCategories;
    } catch (err) {
      return [];
    }
  }

  async getCategoryByStore(query: StoreLocationCategoryDto) {
    const { lattitude, longitude, category } = query;
    appLog.info("this is the query", query);
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
    try {
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
      if (!store) throw new NotFoundException();
      const categoryList = await this.getCategoriesByStoreId(
        store.id,
        category
      );
      const banners = await Banner.findAll({
        where: { storeId: store.id },
        attributes: {
          exclude: [
            "position",
            "createdAt",
            "updatedAt",
            "status",
            "img_mob",
            "storeId",
          ],
        },
      });
      return new DataResponseDto(
        { store, category: categoryList, banners },
        true,
        successMsg
      );
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async getCategoriesByStoreId(
    storeId: number,
    category?: string
  ): Promise<Category[]> {
    try {
      const Categories = await Category.findAll({
        attributes: ["id", "name", "image", "description"],
        // where: {
        //   id: {
        //     [Op.in]: Sequelize.literal(
        //       `(SELECT DISTINCT("category") FROM public."PRODUCTS" WHERE "store_id" = ${storeId})`
        //     ),
        //   },
        // },
      });
      return Categories;
    } catch (err) {
      return [];
    }
  }
  
}
