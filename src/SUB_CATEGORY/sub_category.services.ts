import {
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { SubCategory } from "./sub_category.entity";
import { CreateSubCategoryDto } from "./dto/create.dto";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { Op } from "sequelize";
import { Category } from "../CATEGORY/category.entity";
import { PageOptionsDtoSubcategory } from "./dto/search_subcategory.dto";
import { getErrorMessage } from "../shared/helpers/errormessage";
import { UpdateSubcategoryPositionDto } from "./dto/updatePosition.dto";
import { UpdateSubCategoryDto } from "./dto/update.dto";

@Injectable()
export class SubCategoryService {
  constructor(
    @Inject("SubCategoryRepository")
    private readonly SubCategoryRepository: typeof SubCategory,
    @Inject("Slugify") private readonly slugify: (slug: string) => string
  ) {}

  async findById(id: number) {
    try {
      const data = await this.SubCategoryRepository.findByPk<SubCategory>(id, {
        attributes: { exclude: ["createdAt", "updatedAt", "position "] },
      });
      if (!data) throw new NotFoundException();
      return data;
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async findAll(pageOptionsDto: PageOptionsDtoSubcategory) {
    try {
      const { search, category } = pageOptionsDto;
      const { rows, count } =
        await this.SubCategoryRepository.findAndCountAll<SubCategory>({
          include: [
            {
              model: Category,
              required: true,
              attributes: ["name"],
            },
          ],
          where: {
            ...(search && { name: { [Op.iLike]: `%${search}%` } }),
            ...(category && { category_id: category }),
          },
          limit: pageOptionsDto.take,
          offset: pageOptionsDto.offset,
        });
      return new DataResponseDto(rows, true, "Success", pageOptionsDto, count);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async create(create: CreateSubCategoryDto) {
    try {
      const subcategory = await this.SubCategoryRepository.create({
        ...create,
        slug: this.slugify(create?.name),
      });
      return new DataResponseDto(subcategory, true, "Successfully Created");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async update(_id: number, data: UpdateSubCategoryDto) {
    try {
      const [updated] = await this.SubCategoryRepository.update(
        { ...data, ...(data.name && { slug: this.slugify(data?.name) }) },
        { where: { _id } }
      );
      if (updated == 0) throw new NotFoundException();
      return new DataResponseDto(updated, true, "Subcategory Updated.");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async delete(_id: number) {
    try {
      const deleted = await this.SubCategoryRepository.destroy({
        where: { _id },
      });
      if (deleted == 0) throw new NotFoundException();
      return new DataResponseDto(deleted, true, "Successfully Deleted");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async getSubCategoryNames(name: string): Promise<string[]> {
    try {
      const data = await this.SubCategoryRepository.findAll({
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

  async getSubCategoryID(name: string): Promise<number> {
    try {
      const subcategory = await this.SubCategoryRepository.findOne({
        where: {
          name: { [Op.iLike]: `%${name.trim()}%` },
        },
      });
      const subcategoryId = subcategory?._id ? subcategory._id : 0;
      return subcategoryId;
    } catch (err) {
      return 0;
    }
  }

  async updatePosition(
    _id: number,
    { position }: UpdateSubcategoryPositionDto
  ) {
    try {
      const [updated] = await this.SubCategoryRepository.update(
        {
          position,
        },
        { where: { _id } }
      );
      if (updated == 0) throw new NotFoundException();
      return new DataResponseDto(updated, true, "Position Updated");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }
}
