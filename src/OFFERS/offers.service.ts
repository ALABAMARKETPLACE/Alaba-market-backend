import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Inject,
} from "@nestjs/common";
import { Offers } from "./offers.entity";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { CreateOffersDto } from "./dto/createOffers.dto";
import { UpdateOffersDto } from "./dto/updateOffers.dto";
import { OffersDto } from "./dto/offers.dto";
import { getErrorMessage } from "../shared/helpers/errormessage";
import { Products } from "../PRODUCTS/products.entity";
import { OfferProducts } from "../OFFER_PRODUCTS/offer_products.entity";
import { Op } from "sequelize";
import { InjectModel } from "@nestjs/sequelize";
import { OffersQueryDto } from "./dto/query.dto";
import { Role } from "../shared/enum/role.enum";
@Injectable()
export class OffersService {
  constructor(
    @InjectModel(Offers)
    private readonly OffersRepository: typeof Offers,
    @Inject("Slugify") private readonly slugify: (slug: string) => string
  ) {}
  async getOne(slug: string) {
    try {
      const offer = await this.OffersRepository.findOne({
        where: {
          slug,
        },
      });
      if (!offer) throw new NotFoundException();
      return new DataResponseDto(offer);
    } catch (err) {
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async findAll(querys: OffersQueryDto, role: string | null) {
    const { offset, limit, query, status } = querys;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    try {
      const { rows, count } = await this.OffersRepository.findAndCountAll({
        limit,
        offset,
        order: [["createdAt", "DESC"]],
        where: {
          ...(query && { title: { [Op.iLike]: `%${query}%` } }),
          ...(role != Role.Admin && { status: true }),
          ...(status == "active" && { status: true }),
          ...(status == "inactive" && { status: false }),
          ...(status == "expired"
            ? {
                end_date: {
                  [Op.lt]: today,
                },
              }
            : {
                end_date: {
                  [Op.gte]: today,
                },
              }),
        },
        attributes: { exclude: ["updatedAt"] },
        include: [
          ...(role == Role.Admin
            ? [
                {
                  model: Products,
                  required: false,
                  attributes: ["_id", "name", "image", "retail_rate", "slug"],
                  through: { attributes: ["id"] },
                },
              ]
            : []),
        ],
      });
      const offers = rows.map((item) => new OffersDto(item));
      return new DataResponseDto(offers, querys, count);
    } catch (err) {
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async findOffers(querys: OffersQueryDto, role: string | null) {
    const { offset, limit, query, status } = querys;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    try {
      const { rows, count } = await this.OffersRepository.findAndCountAll({
        limit,
        offset,
        where: {
          status: true,
          [Op.and]: [
            { start_date: { [Op.lte]: today } },
            { end_date: { [Op.gte]: today } },
          ],
        },
        attributes: { exclude: ["updatedAt", "createdAt"] },
      });
      const offers = rows.map((item) => new OffersDto(item));
      return new DataResponseDto(offers, querys, count);
    } catch (err) {
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async create(body: CreateOffersDto) {
    try {
      const result = await this.OffersRepository.sequelize.transaction(async (t) => {
        const created = await this.OffersRepository.create(
          {
            start_date: body.start_date,
            end_date: body.end_date,
            tag: body.tag,
            title: body.title,
            comment: body.comment,
            image: body.image,
            slug: this.slugify(body.title),
            ...(body.status != null && { status: body.status }),
          },
          { transaction: t }
        );
        const products = body.products?.map((item: number) => ({
          productId: item,
          offerId: created?.id,
        }));
        const offer_products = await OfferProducts.bulkCreate(products, {
          transaction: t,
        });
        return { offer: new OffersDto(created), offer_products };
      });
      return new DataResponseDto(result);
    } catch (err) {
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async update(id: number, body: UpdateOffersDto) {
    try {
      const result = await this.OffersRepository.sequelize.transaction(async (transaction) => {
        const [updated, [offer]] = await this.OffersRepository.update(
          {
            ...body,
          },
          { where: { id }, returning: true, transaction }
        );
        if (updated == 0) throw new NotFoundException();
        if (body.products?.length) {
          const products = body.products?.map((item: number) => ({
            productId: item,
            offerId: offer?.id,
          }));
          const offer_products = await OfferProducts.bulkCreate(products, {
            transaction,
          });
        }
        return offer;
      });
      return new DataResponseDto(result);
    } catch (err) {
      throw new InternalServerErrorException();
    }
  }

  async delete(id: number) {
    try {
      const deleted = await this.OffersRepository.destroy({ where: { id } });
      if (deleted == 0) throw new NotFoundException();
      return new DataResponseDto(deleted);
    } catch (err) {
      throw new InternalServerErrorException();
    }
  }

  async deleteOfferProducts(id: number) {
    try {
      const response = await OfferProducts.destroy({
        where: {
          id,
        },
      });
      if (response == 0) throw new NotFoundException();
      return new DataResponseDto(response, "Item Removed Successfully.");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }
}
