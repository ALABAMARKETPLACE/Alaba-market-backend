import {
  Injectable,
  Inject,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { BoostRequest } from "./boost-request.entity";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { CreateBoostRequestDto } from "./dto/create-boost-request.dto";
import { UpdateBoostRequestDto } from "./dto/update-boost-request.dto";
import { BoostRequestDto } from "./dto/boost-request.dto";
import { GetAllBoostRequestsDto } from "./dto/get-all-boost-requests.dto";
import { ApproveBoostRequestDto } from "./dto/approve-boost-request.dto";
import { Op, Sequelize } from "sequelize";
import { getErrorMessage } from "../shared/helpers/errormessage";
import { SubscriptionPlan } from "../SUBSCRIPTION_PLANS/subscription-plan.entity";
import { Store } from "../STORE/store.entity";
import { Products } from "../PRODUCTS/products.entity";
import { UpdateBoostPriorityDto } from "./dto/update-boost-priority.dto";
import { MailService } from "../MAILS/Mails.services";
import { SettingsService } from "../SETTINGS/settings.service";
import { ToAdminBoostRequestCreate } from "../MAILS/templates/boost-requests/toAdmin_boostRequestCreate";
import { ToAdminBoostRequestUpdate } from "../MAILS/templates/boost-requests/toAdmin_boostRequestUpdate";

@Injectable()
export class BoostRequestService {
  constructor(
    @Inject("BoostRequestRepository")
    private readonly boostRequestRepository: typeof BoostRequest,
    @Inject("SubscriptionPlanRepository")
    private readonly subscriptionPlanRepository: typeof SubscriptionPlan,
    @Inject("ProductsRepository")
    private readonly productsRepository: typeof Products,
    @Inject("StoreRepository")
    private readonly storeRepository: typeof Store,
    private readonly mailService: MailService,
    private readonly settingsService: SettingsService
  ) {}

  async findAll(query: GetAllBoostRequestsDto) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        status,
        seller_id,
        plan_id,
      } = query;
      const offset = (page - 1) * limit;

      // Build where clause
      const whereClause: any = {};

      // Filter by seller_id from query (frontend sends this)
      if (seller_id) {
        whereClause.seller_id = seller_id;
      }

      if (status && status !== "all") {
        whereClause.status = status;
      }

      if (plan_id) {
        whereClause.plan_id = plan_id;
      }

      // Build include for search
      const include: any[] = [
        {
          model: Store,
          as: "seller",
          attributes: ["id", "name", "email", "phone"],
          ...(search && {
            where: Sequelize.where(
              Sequelize.fn("LOWER", Sequelize.col("seller.name")),
              {
                [Op.like]: `%${search.toLowerCase()}%`,
              }
            ),
          }),
        },
        {
          model: SubscriptionPlan,
          as: "plan",
          attributes: [
            "id",
            "name",
            "min_products",
            "max_products",
            "duration_days",
            "price",
          ],
        },
      ];

      const { count, rows } = await this.boostRequestRepository.findAndCountAll(
        {
          where: whereClause,
          include,
          order: [["createdAt", "DESC"]],
          limit,
          offset,
          distinct: true,
        }
      );

      // Fetch products for each request
      const data = await Promise.all(
        rows.map(async (item: BoostRequest) => {
          const dto = new BoostRequestDto(item);

          // Fetch product details
          if (item.product_ids && item.product_ids.length > 0) {
            const products = await this.productsRepository.findAll({
              where: {
                _id: {
                  [Op.in]: item.product_ids,
                },
              },
              attributes: ["_id", "name", "image", "price"],
            });
            dto.products = products.map((p) => ({
              id: p._id,
              name: p.name,
              image: p.image,
              price: p.price,
            }));
          }

          return dto;
        })
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

  // For Admin - view all boost requests
  async findAllAdmin(query: GetAllBoostRequestsDto) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        status,
        seller_id,
        plan_id,
      } = query;
      const offset = (page - 1) * limit;

      // Build where clause
      const whereClause: any = {};

      // Admin can filter by seller_id if provided
      if (seller_id) {
        whereClause.seller_id = seller_id;
      }

      if (status && status !== "all") {
        whereClause.status = status;
      }

      if (plan_id) {
        whereClause.plan_id = plan_id;
      }

      // Build include for search
      const include: any[] = [
        {
          model: Store,
          as: "seller",
          attributes: ["id", "name", "email", "phone"],
          ...(search && {
            where: Sequelize.where(
              Sequelize.fn("LOWER", Sequelize.col("seller.name")),
              {
                [Op.like]: `%${search.toLowerCase()}%`,
              }
            ),
          }),
        },
        {
          model: SubscriptionPlan,
          as: "plan",
          attributes: [
            "id",
            "name",
            "min_products",
            "max_products",
            "duration_days",
            "price",
          ],
        },
      ];

      const { count, rows } = await this.boostRequestRepository.findAndCountAll(
        {
          where: whereClause,
          include,
          order: [["createdAt", "DESC"]],
          limit,
          offset,
          distinct: true,
        }
      );

      // Fetch products for each request
      const data = await Promise.all(
        rows.map(async (item: BoostRequest) => {
          const dto = new BoostRequestDto(item);

          // Fetch product details
          if (item.product_ids && item.product_ids.length > 0) {
            const products = await this.productsRepository.findAll({
              where: {
                _id: {
                  [Op.in]: item.product_ids,
                },
              },
              attributes: ["_id", "name", "image", "price"],
            });
            dto.products = products.map((p) => ({
              id: p._id,
              name: p.name,
              image: p.image,
              price: p.price,
            }));
          }

          return dto;
        })
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
      const boostRequest = await this.boostRequestRepository.findByPk(id, {
        include: [
          {
            model: Store,
            as: "seller",
            attributes: ["id", "name", "email", "phone"],
          },
          {
            model: SubscriptionPlan,
            as: "plan",
            attributes: [
              "id",
              "name",
              "min_products",
              "max_products",
              "duration_days",
              "price",
            ],
          },
        ],
      });

      if (!boostRequest) {
        throw new NotFoundException("Boost request not found");
      }

      const dto = new BoostRequestDto(boostRequest);

      // Fetch product details
      if (boostRequest.product_ids && boostRequest.product_ids.length > 0) {
        const products = await this.productsRepository.findAll({
          where: {
            _id: {
              [Op.in]: boostRequest.product_ids,
            },
          },
          attributes: ["_id", "name", "image", "price", "sku"],
        });
        dto.products = products.map((p) => ({
          id: p._id,
          name: p.name,
          image: p.image,
          price: p.price,
          sku: p.sku,
        }));
      }

      return new DataResponseDto(dto, true, "Successfully Retrieved");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async create(sellerId: number, createDto: CreateBoostRequestDto) {
    try {
      // Validate seller_id exists in Store table
      const seller = await this.storeRepository.findByPk(sellerId);
      if (!seller) {
        throw new BadRequestException(
          `Seller with ID ${sellerId} not found. Please ensure you're logged in as a seller.`
        );
      }

      // Validate subscription plan exists and is active
      const plan = await this.subscriptionPlanRepository.findByPk(
        createDto.plan_id
      );

      if (!plan) {
        throw new BadRequestException("Subscription plan not found");
      }

      if (!plan.is_active) {
        throw new BadRequestException("This subscription plan is not active");
      }

      // Get days from plan duration
      const days = plan.duration_days;

      if (days < 1) {
        throw new BadRequestException(
          "Plan duration must be at least 1 day"
        );
      }

      // Validate product count is within plan limits
      const productCount = createDto.product_ids.length;
      if (
        productCount < plan.min_products ||
        productCount > plan.max_products
      ) {
        throw new BadRequestException(
          `Product count must be between ${plan.min_products} and ${plan.max_products} for this plan`
        );
      }

      // Validate all products exist
      const products = await this.productsRepository.findAll({
        where: {
          _id: {
            [Op.in]: createDto.product_ids,
          },
        },
      });

      if (products.length !== createDto.product_ids.length) {
        throw new BadRequestException("Some product IDs are invalid");
      }

      // Calculate total amount: product_count × price (price is per product for the plan duration)
      const totalAmount = productCount * Number(plan.price);

      // Create boost request
      const boostRequest = new BoostRequest();
      boostRequest.seller_id = sellerId;
      boostRequest.plan_id = createDto.plan_id;
      boostRequest.product_ids = createDto.product_ids;
      boostRequest.days = days;
      boostRequest.total_amount = totalAmount;
      boostRequest.status = "pending";
      boostRequest.requested_at = new Date();
      boostRequest.remarks = createDto.remarks || null;
      boostRequest.last_updated_by = sellerId;

      await boostRequest.save();

      // Fetch with relations
      const created = await this.boostRequestRepository.findByPk(
        boostRequest.id,
        {
          include: [
            {
              model: Store,
              as: "seller",
              attributes: ["id", "name", "email", "phone"],
            },
            {
              model: SubscriptionPlan,
              as: "plan",
              attributes: [
                "id",
                "name",
                "duration_days",
                "price",
                "min_products",
                "max_products",
              ],
            },
          ],
        }
      );

      // Send email notification to admin
      try {
        const adminEmail = await this.settingsService.getAdminEmail();
        if (adminEmail) {
          const adminMail = await ToAdminBoostRequestCreate(
            created,
            adminEmail
          );
          await this.mailService.sellerEmails(adminMail);
        }
      } catch (emailErr) {
        // Log error but don't fail the request
        console.error("Error sending boost request creation email:", emailErr);
      }

      const data = new BoostRequestDto(created);
      return new DataResponseDto(
        data,
        true,
        "Boost request created successfully"
      );
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async update(sellerId: number, updateDto: UpdateBoostRequestDto) {
    try {
      const boostRequest = await this.boostRequestRepository.findByPk(
        updateDto.id
      );

      if (!boostRequest) {
        throw new NotFoundException("Boost request not found");
      }

      // Only allow updates if status is pending
      if (boostRequest.status !== "pending") {
        throw new BadRequestException(
          "Cannot update boost request that is not in pending status"
        );
      }

      // Validate seller owns this request
      const requestSellerId =
        typeof boostRequest.seller_id === "string"
          ? Number(boostRequest.seller_id)
          : boostRequest.seller_id;
      const incomingSellerId =
        typeof sellerId === "string" ? Number(sellerId) : sellerId;

      if (
        requestSellerId === null ||
        requestSellerId === undefined ||
        incomingSellerId === null ||
        incomingSellerId === undefined ||
        Number.isNaN(requestSellerId) ||
        Number.isNaN(incomingSellerId) ||
        requestSellerId !== incomingSellerId
      ) {
        throw new BadRequestException(
          "You can only update your own boost requests"
        );
      }

      // Fetch old request data with relations for email notification
      const oldRequest = await this.boostRequestRepository.findByPk(
        updateDto.id,
        {
          include: [
            {
              model: Store,
              as: "seller",
              attributes: ["id", "name", "email", "phone"],
            },
            {
              model: SubscriptionPlan,
              as: "plan",
              attributes: [
                "id",
                "name",
                "duration_days",
                "price",
                "min_products",
                "max_products",
              ],
            },
          ],
        }
      );

      let plan = null;
      let productCount = boostRequest.product_ids.length;
      let days = boostRequest.days;

      // If plan_id is being updated, validate it and update days
      if (updateDto.plan_id !== undefined) {
        plan = await this.subscriptionPlanRepository.findByPk(
          updateDto.plan_id
        );

        if (!plan) {
          throw new BadRequestException("Subscription plan not found");
        }

        if (!plan.is_active) {
          throw new BadRequestException("This subscription plan is not active");
        }

        boostRequest.plan_id = updateDto.plan_id;
        // Update days to match new plan's duration
        days = plan.duration_days;
        boostRequest.days = days;
      } else {
        // Fetch current plan for recalculation
        plan = await this.subscriptionPlanRepository.findByPk(
          boostRequest.plan_id
        );
      }

      // If product_ids is being updated
      if (updateDto.product_ids !== undefined) {
        productCount = updateDto.product_ids.length;

        // Validate product count
        if (
          productCount < plan.min_products ||
          productCount > plan.max_products
        ) {
          throw new BadRequestException(
            `Product count must be between ${plan.min_products} and ${plan.max_products} for this plan`
          );
        }

        // Validate all products exist
        const products = await this.productsRepository.findAll({
          where: {
            _id: {
              [Op.in]: updateDto.product_ids,
            },
          },
        });

        if (products.length !== updateDto.product_ids.length) {
          throw new BadRequestException("Some product IDs are invalid");
        }

        boostRequest.product_ids = updateDto.product_ids;
      }

      // Update remarks if provided
      if (updateDto.remarks !== undefined) {
        boostRequest.remarks = updateDto.remarks;
      }

      // Recalculate total amount
      const totalAmount = productCount * Number(plan.price);
      boostRequest.total_amount = totalAmount;
      boostRequest.last_updated_by = sellerId;

      await boostRequest.save();

      // Fetch with relations
      const updated = await this.boostRequestRepository.findByPk(
        boostRequest.id,
        {
          include: [
            {
              model: Store,
              as: "seller",
              attributes: ["id", "name", "email", "phone"],
            },
            {
              model: SubscriptionPlan,
              as: "plan",
              attributes: [
                "id",
                "name",
                "duration_days",
                "price",
                "min_products",
                "max_products",
              ],
            },
          ],
        }
      );

      // Send email notification to admin
      try {
        const adminEmail = await this.settingsService.getAdminEmail();
        if (adminEmail) {
          const adminMail = await ToAdminBoostRequestUpdate(
            oldRequest,
            updated,
            adminEmail
          );
          await this.mailService.sellerEmails(adminMail);
        }
      } catch (emailErr) {
        // Log error but don't fail the request
        console.error("Error sending boost request update email:", emailErr);
      }

      const data = new BoostRequestDto(updated);
      return new DataResponseDto(
        data,
        true,
        "Boost request updated successfully"
      );
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async delete(id: number) {
    try {
      const boostRequest = await this.boostRequestRepository.findByPk(id);

      if (!boostRequest) {
        throw new NotFoundException("Boost request not found");
      }

      // Soft delete
      await boostRequest.destroy();

      return new DataResponseDto(
        {},
        true,
        "Boost request deleted successfully"
      );
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async approve(adminId: number, approveDto: ApproveBoostRequestDto) {
    try {
      const boostRequest = await this.boostRequestRepository.findByPk(
        approveDto.id
      );

      if (!boostRequest) {
        throw new NotFoundException("Boost request not found");
      }

      // Only allow approval/rejection if status is pending
      if (boostRequest.status !== "pending") {
        throw new BadRequestException(
          "Can only approve/reject requests with pending status"
        );
      }

      // Update status
      boostRequest.status = approveDto.status;
      boostRequest.last_updated_by = adminId;
      if (approveDto.priority !== undefined && approveDto.priority !== null) {
        (boostRequest as any).boost_priority = approveDto.priority;
      }

      if (approveDto.status === "approved") {
        boostRequest.approved_at = new Date();
      }

      if (approveDto.remarks) {
        boostRequest.remarks = approveDto.remarks;
      }

      await boostRequest.save();

      // Fetch with relations
      const updated = await this.boostRequestRepository.findByPk(
        boostRequest.id,
        {
          include: [
            {
              model: Store,
              as: "seller",
              attributes: ["id", "name", "email"],
            },
            {
              model: SubscriptionPlan,
              as: "plan",
              attributes: ["id", "name", "duration_days", "price"],
            },
          ],
        }
      );

      const data = new BoostRequestDto(updated);
      return new DataResponseDto(
        data,
        true,
        `Boost request ${approveDto.status} successfully`
      );
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async updatePriority(adminId: number, body: UpdateBoostPriorityDto) {
    try {
      const br = await this.boostRequestRepository.findByPk(body.id);
      if (!br) throw new NotFoundException("Boost request not found");
      if (br.status !== "approved")
        throw new BadRequestException(
          "Only approved requests can set priority"
        );
      (br as any).boost_priority = body.priority;
      br.last_updated_by = adminId;
      await br.save();
      const updated = await this.boostRequestRepository.findByPk(br.id, {
        include: [
          {
            model: Store,
            as: "seller",
            attributes: ["id", "name", "email"],
          },
          {
            model: SubscriptionPlan,
            as: "plan",
            attributes: ["id", "name", "duration_days", "price"],
          },
        ],
      });

      const data = updated ? new BoostRequestDto(updated) : null;

      return new DataResponseDto(data, true, "Priority updated successfully");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async findActive() {
    try {
      const now = new Date();

      // Fetch all approved boost requests
      const rows = await this.boostRequestRepository.findAll({
        where: {
          status: "approved" as any,
        },
        include: [
          {
            model: Store,
            as: "seller",
            attributes: ["id", "name", "email"],
          },
          {
            model: SubscriptionPlan,
            as: "plan",
            attributes: ["id", "name", "duration_days", "price"],
          },
        ],
        order: [
          [Sequelize.literal('COALESCE("boost_priority", 100)'), "ASC"],
          ["approved_at", "ASC"],
        ],
      });

      // Filter active boosts: approved_at <= now AND approved_at + days > now
      const activeRows = rows.filter((boost: any) => {
        if (!boost.approved_at) return false;

        const approvedDate = new Date(boost.approved_at);
        const endDate = new Date(approvedDate);
        endDate.setDate(endDate.getDate() + boost.days);

        return approvedDate <= now && endDate > now;
      });

      const data = activeRows.map((r) => new BoostRequestDto(r));
      return new DataResponseDto(data, true, "Active boosts");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }
}
