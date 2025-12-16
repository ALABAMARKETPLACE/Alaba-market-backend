import {
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { Banner } from "./banner.entity";
import { CreateBannerDto } from "./dto/create.dto";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { Store } from "../STORE/store.entity";
import { getErrorMessage } from "../shared/helpers/errormessage";
import { PageOptionsDtoBanner } from "./dto/banner_search.dto";
import { Op, Sequelize } from "sequelize";
import { UpdateBannerPositionDto } from "./dto/updatePosition.dto";
import { UpdateBannerDto } from "./dto/update.dto";
import { Role } from "../shared/enum/role.enum";
@Injectable()
export class BannerService {
  constructor(
    @Inject("BannerRepository")
    private readonly BannerRepository: typeof Banner
  ) {}

  async findAll(
    pageOptions: PageOptionsDtoBanner,
    storeId: number,
    role: string
  ) {
    try {
      const { search } = pageOptions;
      const { rows, count } =
        await this.BannerRepository.findAndCountAll<Banner>({
          attributes: {
            exclude: ["updatedAt", "storeId"],
          },
          where: {
            ...(search && { title: { [Op.iLike]: `%${search}%` } }),
            ...(role != Role.Admin && { storeId }),
          },
          limit: pageOptions.take,
          offset: pageOptions.offset,
          order: [
            [
              Sequelize.literal(`CASE WHEN "storeId" = ? THEN 0 ELSE 1 END`),
              "ASC",
            ],
            ["position", "DESC"],
          ],
          include: [
            {
              model: Store,
              required: false,
              attributes: ["store_name"],
            },
          ],
          replacements: [storeId],
        });
      return new DataResponseDto(rows, true, "Successfull", pageOptions, count);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async create(storeId: number, create: CreateBannerDto, role: string) {
    try {
      const banner = await Banner.create({
        ...create,
        storeId,
        status: role === Role.Admin ? true : false,
      });
      return new DataResponseDto(banner, true, "Successfully Created");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async update(
    storeId: number,
    id: number,
    data: UpdateBannerDto,
    role: string
  ) {
    try {
      const [updated] = await this.BannerRepository.update(
        { ...data },
        {
          where: {
            id,
            ...(role !== Role.Admin && { storeId }),
          },
        }
      );
      if (updated == 0) throw new NotFoundException();
      return new DataResponseDto(updated, true, "Banner Successfully Updated");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async delete(id: number, storeId: number, role: string) {
    try {
      const deleted = await this.BannerRepository.destroy({
        where: { id, ...(role !== Role.Admin && { storeId }) },
      });
      if (deleted == 0) throw new NotFoundException();
      return new DataResponseDto(deleted, true, "Successfully Deleted");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async changeStatus(id: number) {
    try {
      const [status, [updated]] = await this.BannerRepository.update(
        {
          status: Sequelize.literal("NOT status"),
        },
        { where: { id }, returning: true }
      );
      if (status == 0) throw new NotFoundException();
      const msg = `${updated?.status == true ? "Added to" : "Removed from"}`;
      return new DataResponseDto(updated, true, `Banner ${msg} Alaba Marketplace Home`);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async updatePosition(id: number, { position }: UpdateBannerPositionDto) {
    try {
      const [updated] = await this.BannerRepository.update(
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
}
