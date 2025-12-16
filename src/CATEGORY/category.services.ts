import {
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { Category } from "./category.entity";
import { CategoryDto } from "./dto/category.dto";
import { CreateCategoryDto } from "./dto/create.dto";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { SubCategory } from "../SUB_CATEGORY/sub_category.entity";
import { Op, Sequelize } from "sequelize";
import { getErrorMessage } from "../shared/helpers/errormessage";
import { CategorySearchDto } from "./dto/category_search.dto";
import { UpdateCategoryPositionDto } from "./dto/updateCategoryPosition.dto";
import { UpdateCategoryDto } from "./dto/update.dto";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import ProjectKeys from "../shared/constants/keynames";
const { category_cache_key } = ProjectKeys;
@Injectable()
export class CategoryService {
  constructor(
    @Inject("CategoryRepository")
    private readonly CategoryRepository: typeof Category,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}
  async findOne(id: number) {
    try {
      const category = await this.CategoryRepository.findByPk(id);
      if (!category) throw new NotFoundException();
      return new DataResponseDto(category);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async findAll(pageOptionsDto: CategorySearchDto) {
    try {
      const { search } = pageOptionsDto;
      const where = { ...(search && { name: { [Op.iLike]: `%${search}%` } }) };
      const { rows, count } =
        await this.CategoryRepository.findAndCountAll<Category>({
          where,
          limit: pageOptionsDto.take,
          offset: pageOptionsDto.offset,
          order: [["position", pageOptionsDto.order]],
        });
      const data = rows?.map((item) => new CategoryDto(item));
      return new DataResponseDto(data, true, "Success", pageOptionsDto, count);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async create(create: CreateCategoryDto) {
    try {
      const cat = await this.CategoryRepository.create({
        ...create,
      });
      const msg = "Successfully Created New item";
      await this.findAllCategory(); //to update the data in cache.
      return new DataResponseDto(cat, true, msg);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async update(id: number, data: UpdateCategoryDto) {
    try {
      const [status, [updated]] = await this.CategoryRepository.update(
        { ...data },
        { where: { id }, returning: true }
      );
      if (status == 0) throw new NotFoundException();
      return new DataResponseDto(updated, true, "Successfully Updated");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async delete(id: number) {
    try {
      const deleted = await this.CategoryRepository.destroy({ where: { id } });
      if (deleted == 0) throw new NotFoundException();
      return new DataResponseDto(deleted, true, "Successfully Deleted");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async findAllCategory() {
    try {
      const categories = await this.CategoryRepository.findAll({
        attributes: {
          exclude: [
            "featured",
            "featuredTitle",
            "position",
            "createdAt",
            "updatedAt",
          ],
        },
        include: [
          {
            model: SubCategory,
            required: false,
            attributes: {
              exclude: ["createdAt", "updatedAt", "position"],
            },
          },
        ],
        order: [
          [Sequelize.col("Category.position"), "ASC"],
          [Sequelize.col("sub_categories.position"), "ASC"],
        ],
      });
      await this.cacheManager.set(category_cache_key, categories);
      return new DataResponseDto(categories, true, "success");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async getCategoryNames(name: string): Promise<string[]> {
    try {
      const data = await this.CategoryRepository.findAll({
        where: {
          name: { [Op.startsWith]: name },
        },
        attributes: ["name"],
        group: ["name"],
      });
      const response = data?.map((item: any) => item.name);
      return response;
    } catch (err) {
      return [];
    }
  }

  async getCategoryID(name: string): Promise<number> {
    try {
      const category = await this.CategoryRepository.findOne({
        where: {
          name: { [Op.iLike]: `%${name.trim()}%` },
        },
      });
      const categoryId: number = category?.id ? category.id : 0;
      return categoryId;
    } catch (err) {
      return 0;
    }
  }

  async updatePosition(id: number, { position }: UpdateCategoryPositionDto) {
    try {
      const [updated] = await this.CategoryRepository.update(
        {
          position,
        },
        { where: { id } }
      );
      if (updated == 0) throw new NotFoundException();
      const msg = "Position Updated successfully";
      return new DataResponseDto(updated, true, msg);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async findFeatured() {
    try {
      // const subc = await SubCategory.findAll({
      //   attributes: ["_id", "name", "description", "bannerImg", "slug"],
      //   include: [
      //     {
      //       attributes: [],
      //       model: Category,
      //       required: true,
      //       where: { featured: true },
      //     },
      //   ],
      // });
      const data = [
        {
          _id: "113",
          name: "Tea & Coffee",
          description: "for Office",
          image:
            "https://bairuha-bucket.s3.ap-south-1.amazonaws.com/nextmiddleeast/products/1721912884189.jpg",
          slug: "tea-and-coffee",
          category_id: "74",
          bannerImg:
            "https://nextme-bucket.s3.amazonaws.com/nextmiddleeast/products/1729232263500.jpg",
        },
        {
          _id: "107",
          name: "Toners/Cartridges",
          description: "Toner cartridges contain toner",
          image:
            "https://bairuha-bucket.s3.ap-south-1.amazonaws.com/nextmiddleeast/products/1721987183187.jpg",
          slug: "tonerscartridges",
          category_id: "30",
          bannerImg:
            "https://nextme-bucket.s3.amazonaws.com/nextmiddleeast/products/1729232567088.jpg",
        },
        {
          _id: "123",
          name: "Art & Crafts",
          description:
            "Unleash creativity with our diverse selection of art and craft supplies",
          image:
            "https://bairuha-bucket.s3.ap-south-1.amazonaws.com/nextmiddleeast/products/1707245578063.jpg",
          slug: "art-and-crafts",
          category_id: "73",
          bannerImg:
            "https://nextme-bucket.s3.amazonaws.com/nextmiddleeast/products/1729245711356.jpg",
        },
        {
          _id: "70",
          name: "Bouquets",
          description: "All kinds of Bouquets available.",
          image:
            "https://bairuha-bucket.s3.ap-south-1.amazonaws.com/nextmiddleeast/products/1703153429660.jpg",
          slug: "bouquets",
          category_id: "29",
          bannerImg:
            "https://nextme-bucket.s3.amazonaws.com/nextmiddleeast/products/1729245766772.jpg",
        },
        {
          _id: "140",
          name: "Disposables",
          description: "Tissue, Napkin, Spoon, Fork, Stirrers etc...",
          image:
            "https://bairuha-bucket.s3.ap-south-1.amazonaws.com/nextmiddleeast/products/1715876831065.jpg",
          slug: "disposables",
          category_id: "74",
          bannerImg:
            "https://nextme-bucket.s3.amazonaws.com/nextmiddleeast/products/1729233515233.jpg",
        },
      ];
      return new DataResponseDto(data, true, "Success");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }
}
