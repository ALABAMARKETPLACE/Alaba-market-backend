import {
  Injectable,
  Inject,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  BadRequestException,
} from "@nestjs/common";
import { SubscriptionPlan } from "./subscription-plan.entity";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { CreateSubscriptionPlanDto } from "./dto/create-subscription-plan.dto";
import { UpdateSubscriptionPlanDto } from "./dto/update-subscription-plan.dto";
import { SubscriptionPlanDto } from "./dto/subscription-plan.dto";
import { GetAllSubscriptionPlansDto } from "./dto/get-all-subscription-plans.dto";
import { UpdateFeaturedPositionDto } from "./dto/update-featured-position.dto";
import { Op, Sequelize } from "sequelize";
import { getErrorMessage } from "../shared/helpers/errormessage";

@Injectable()
export class SubscriptionPlanService {
  constructor(
    @Inject("SubscriptionPlanRepository")
    private readonly subscriptionPlanRepository: typeof SubscriptionPlan
  ) {}

  async findAll(query: GetAllSubscriptionPlansDto) {
    try {
      const { page = 1, limit = 10, search, is_active } = query;
      const offset = (page - 1) * limit;

      // Build where clause
      const whereClause: any = {};

      if (search) {
        // Case-insensitive search that works for both MySQL and PostgreSQL
        whereClause.name = Sequelize.where(
          Sequelize.fn("LOWER", Sequelize.col("name")),
          {
            [Op.like]: `%${search.toLowerCase()}%`,
          }
        );
      }

      if (is_active !== undefined) {
        whereClause.is_active = is_active;
      }

      const { count, rows } =
        await this.subscriptionPlanRepository.findAndCountAll({
          where: whereClause,
          order: [["createdAt", "DESC"]],
          limit,
          offset,
        });

      const data = rows.map(
        (item: SubscriptionPlan) => new SubscriptionPlanDto(item)
      );

      const response = {
        data,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit),
        },
      };

      return new DataResponseDto(response, true, "Successfully Retrieved");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async findOne(id: number) {
    try {
      const subscriptionPlan = await this.subscriptionPlanRepository.findByPk(
        id
      );

      if (!subscriptionPlan) {
        throw new HttpException(
          "Subscription plan not found",
          HttpStatus.NOT_FOUND
        );
      }

      const data = new SubscriptionPlanDto(subscriptionPlan);
      return new DataResponseDto(data, true, "Successfully Retrieved");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async create(createDto: CreateSubscriptionPlanDto) {
    try {
      // Check for duplicate name
      const existingPlan = await this.subscriptionPlanRepository.findOne({
        where: {
          name: createDto.name,
        },
      });

      if (existingPlan) {
        throw new BadRequestException(
          "Subscription plan with this name already exists"
        );
      }

      // Validate min_products <= max_products (can be equal or less than)
      if (createDto.min_products > createDto.max_products) {
        throw new BadRequestException(
          "Minimum products must be less than or equal to maximum products"
        );
      }

      // Check for duplicate combination of min_products, max_products, duration_days, price, is_active
      const isActive =
        createDto.is_active !== undefined ? createDto.is_active : true;
      const duplicateCombination =
        await this.subscriptionPlanRepository.findOne({
          where: {
            min_products: createDto.min_products,
            max_products: createDto.max_products,
            duration_days: createDto.duration_days,
            price: createDto.price,
            is_active: isActive,
          },
        });

      if (duplicateCombination) {
        throw new BadRequestException(
          "A subscription plan with the same min_products, max_products, duration_days, price, and is_active already exists"
        );
      }

      const subscriptionPlan = new SubscriptionPlan();
      subscriptionPlan.name = createDto.name;
      subscriptionPlan.min_products = createDto.min_products;
      subscriptionPlan.max_products = createDto.max_products;
      subscriptionPlan.duration_days = createDto.duration_days;
      subscriptionPlan.price = createDto.price;
      subscriptionPlan.is_active =
        createDto.is_active !== undefined ? createDto.is_active : true;
      subscriptionPlan.featured_position =
        createDto.featured_position !== undefined
          ? createDto.featured_position
          : 0;

      await subscriptionPlan.save();

      const data = new SubscriptionPlanDto(subscriptionPlan);
      return new DataResponseDto(data, true, "Successfully Created");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async update(updateDto: UpdateSubscriptionPlanDto) {
    try {
      const subscriptionPlan = await this.subscriptionPlanRepository.findByPk(
        updateDto.id
      );

      if (!subscriptionPlan) {
        throw new HttpException(
          "Subscription plan not found",
          HttpStatus.NOT_FOUND
        );
      }

      // Check for duplicate name if name is being updated
      if (
        updateDto.name !== undefined &&
        updateDto.name !== subscriptionPlan.name
      ) {
        const existingPlan = await this.subscriptionPlanRepository.findOne({
          where: {
            name: updateDto.name,
          },
        });

        if (existingPlan) {
          throw new BadRequestException(
            "Subscription plan with this name already exists"
          );
        }
      }

      // Update fields if provided
      if (updateDto.name !== undefined) {
        subscriptionPlan.name = updateDto.name;
      }
      if (updateDto.min_products !== undefined) {
        subscriptionPlan.min_products = updateDto.min_products;
      }
      if (updateDto.max_products !== undefined) {
        subscriptionPlan.max_products = updateDto.max_products;
      }
      if (updateDto.duration_days !== undefined) {
        subscriptionPlan.duration_days = updateDto.duration_days;
      }
      if (updateDto.price !== undefined) {
        subscriptionPlan.price = updateDto.price;
      }
      if (updateDto.is_active !== undefined) {
        subscriptionPlan.is_active = updateDto.is_active;
      }
      if (updateDto.featured_position !== undefined) {
        subscriptionPlan.featured_position = updateDto.featured_position;
      }

      // Validate min_products <= max_products (can be equal or less than)
      if (subscriptionPlan.min_products > subscriptionPlan.max_products) {
        throw new BadRequestException(
          "Minimum products must be less than or equal to maximum products"
        );
      }

      // Check for duplicate combination (excluding current record)
      const duplicateCombination =
        await this.subscriptionPlanRepository.findOne({
          where: {
            id: {
              [Op.ne]: subscriptionPlan.id,
            },
            min_products: subscriptionPlan.min_products,
            max_products: subscriptionPlan.max_products,
            duration_days: subscriptionPlan.duration_days,
            price: subscriptionPlan.price,
            is_active: subscriptionPlan.is_active,
          },
        });

      if (duplicateCombination) {
        throw new BadRequestException(
          "A subscription plan with the same min_products, max_products, duration_days, price, and is_active already exists"
        );
      }

      await subscriptionPlan.save();

      const data = new SubscriptionPlanDto(subscriptionPlan);
      return new DataResponseDto(data, true, "Successfully Updated");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async delete(id: number) {
    try {
      const subscriptionPlan = await this.subscriptionPlanRepository.findByPk(
        id
      );

      if (!subscriptionPlan) {
        throw new HttpException(
          "Subscription plan not found",
          HttpStatus.NOT_FOUND
        );
      }

      // Soft delete
      await subscriptionPlan.destroy();

      return new DataResponseDto({}, true, "Successfully Deleted");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async bulkDelete(ids: number[]) {
    try {
      // Find all plans by IDs (excluding already soft-deleted ones)
      const subscriptionPlans = await this.subscriptionPlanRepository.findAll({
        where: {
          id: {
            [Op.in]: ids,
          },
        },
      });

      if (subscriptionPlans.length === 0) {
        throw new HttpException(
          "No subscription plans found with the provided IDs",
          HttpStatus.NOT_FOUND
        );
      }

      // Check if all IDs were found
      const foundIds = subscriptionPlans.map((plan) => plan.id);
      const notFoundIds = ids.filter((id) => !foundIds.includes(id));

      if (notFoundIds.length > 0) {
        throw new BadRequestException(
          `Subscription plans with IDs [${notFoundIds.join(", ")}] not found`
        );
      }

      // Soft delete all plans (sets deleted_at timestamp, doesn't remove from DB)
      // Because model has paranoid: true, destroy() performs soft delete
      await this.subscriptionPlanRepository.destroy({
        where: {
          id: {
            [Op.in]: ids,
          },
        },
      });

      return new DataResponseDto(
        { deletedCount: subscriptionPlans.length, deletedIds: foundIds },
        true,
        `Successfully deleted ${subscriptionPlans.length} subscription plan(s)`
      );
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  // Additional API: Get all active plans (useful for sellers)
  async findAllActive() {
    try {
      const plans = await this.subscriptionPlanRepository.findAll({
        where: {
          is_active: true,
        },
        order: [["min_products", "ASC"]],
      });

      const data = plans.map(
        (item: SubscriptionPlan) => new SubscriptionPlanDto(item)
      );

      return new DataResponseDto(data, true, "Successfully Retrieved");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  // Update featured position for a subscription plan
  async updateFeaturedPosition(updateDto: UpdateFeaturedPositionDto) {
    try {
      const subscriptionPlan = await this.subscriptionPlanRepository.findByPk(
        updateDto.id
      );

      if (!subscriptionPlan) {
        throw new HttpException(
          "Subscription plan not found",
          HttpStatus.NOT_FOUND
        );
      }

      // Update featured position
      subscriptionPlan.featured_position = updateDto.featured_position;
      await subscriptionPlan.save();

      const data = new SubscriptionPlanDto(subscriptionPlan);
      return new DataResponseDto(
        data,
        true,
        "Featured position updated successfully"
      );
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }
}
