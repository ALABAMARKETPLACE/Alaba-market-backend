import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { Store } from "./store.entity";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { StoreDto } from "./dto/store.dto";
import { UpdateStoreStatusDto } from "./dto/updateStatus.dto";
import { MailService } from "../MAILS/Mails.services";
import { RequestDocumentMailDto } from "./dto/requestDocumentMail.dto";
import { UserService } from "../USERS/user.services";
import { UpdateStoreDto } from "./dto/updateStore.dto";

import { SettingsService } from "../SETTINGS/settings.service";
import { NotificationsService } from "../NOTIFICATIONS/notification.service";
import { SubscriptionPlan } from "../SUBSCRIPTION_PLANS/subscription-plan.entity";
import { ToAdminCorporate } from "../MAILS/templates/sellers/toAdmin_coorporate";
import { ToUserCorporate } from "../MAILS/templates/sellers/toUser_coorporate";
import { ToUserApproval } from "../MAILS/templates/sellers/toUser_Approval";
import { ToUserRejection } from "../MAILS/templates/sellers/toUser_Rejection";
import { getErrorMessage } from "../shared/helpers/errormessage";
import { Op, Sequelize, Transaction } from "sequelize";
import { Order } from "../ORDER/order.entity";
import { Products } from "../PRODUCTS/products.entity";
import { User } from "../USERS/user.entity";
import { StoreSearchPaginationDto } from "./dto/store_search_dto";
import { CreateNewStoreDto } from "./dto/createNewStore.dto";
import { BecomeASellerDto } from "./dto/createStore.dto";
import { StoreAccountDetailsDto } from "./dto/storeAccountDetails.dto";
import { UpdateAccountDetailsDto } from "./dto/updateAccountDetails.dto";
import { RequestDocumentMail } from "../MAILS/templates/sellers/request_documentmail";
import { Cache } from "cache-manager";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { FirebaseService } from "../FIREBASE/firebase.service";
import { Role } from "../shared/enum/role.enum";
import { Settlements } from "../SETTLEMENTS/settlements.entity";
import { PaystackSubaccountService } from "../PAYSTACK_SUBACCOUNTS/paystack-subaccount.service";
import { PaystackSubaccount } from "../PAYSTACK_SUBACCOUNTS/paystack-subaccount.entity";

@Injectable()
export class StoreService {
  constructor(
    @Inject("StoreRepository")
    private readonly StoreRepository: typeof Store,
    private readonly mailService: MailService,
    private readonly userService: UserService,
    private settingsService: SettingsService,
    @Inject("SettlementsRepository")
    private readonly SettlementsRepository: typeof Settlements,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject("Slugify") private readonly slugify: (slug: string) => string,
    private readonly firebaseService: FirebaseService,
    private readonly notificationsService: NotificationsService,
    private readonly paystackSubaccountService: PaystackSubaccountService
  ) {}

  // Generate provisional subaccount code
  private generateProvisionalSubaccountCode(): string {
    const timestamp = Date.now().toString().slice(-6);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `ACCT_${randomStr}${timestamp}`;
  }

  async findAll(pageOptionsDto: StoreSearchPaginationDto, type: string) {
    const { name } = pageOptionsDto;
    const skip = (pageOptionsDto.page - 1) * pageOptionsDto.take;
    try {
      const { rows, count } = await this.StoreRepository.findAndCountAll({
        order: [["createdAt", "DESC"]],
        limit: pageOptionsDto.take,
        offset: skip,
        where: {
          [Op.and]: [
            {
              ...(type &&
                ["approved", "cancelled", "pending"].includes(type) && {
                  status: type,
                }),
            },
            {
              ...(name && {
                [Op.or]: [
                  ...(type == "pending"
                    ? [{ name: { [Op.iLike]: `%${name}%` } }]
                    : [{ store_name: { [Op.iLike]: `%${name}%` } }]),
                  { store_name: { [Op.iLike]: `%${name}%` } },
                  { email: name },
                  { phone: name },
                ],
              }),
            },
            ,
          ],
        },
        attributes: [
          "id",
          "store_name",
          "phone",
          "code",
          "status",
          "name",
          "email",
          "logo_upload",
          [
            Sequelize.literal(
              `((SELECT COALESCE(SUM("ORDER"."grandTotal"), 0)
              FROM "ORDER"
              WHERE "ORDER"."storeId" = "Store"."id" AND "ORDER"."status"='delivered')-(SELECT COALESCE(SUM("SETTLEMENS"."paid"), 0)
              FROM "SETTLEMENS"
              WHERE "SETTLEMENS"."storeId" = "Store"."id" AND "SETTLEMENS"."status"='success'))`
            ),
            "balance",
          ],
        ],
      });
      return new DataResponseDto(rows, true, "Success", pageOptionsDto, count);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async findOne(id: number) {
    try {
      const user = await User.findByPk(id);
      if (!user) throw new Error("No User has been found@@");
      const store = await this.StoreRepository.findByPk(user?.store_id);
      if (!store) throw new NotFoundException();
      const storeData = new StoreDto(store);
      return new DataResponseDto(storeData, true, "Successfully fetched");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async findStore(storeID: number) {
    try {
      const store = await this.StoreRepository.findByPk(storeID);
      if (!store) throw new NotFoundException();
      const storeData = new StoreDto(store);
      return new DataResponseDto(storeData, true, "Successfully fetched");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async getAccountDetails(storeId: number) {
    try {
      const store = await this.StoreRepository.findByPk(storeId);
      if (!store) throw new NotFoundException();
      const details = new StoreAccountDetailsDto(store);
      return new DataResponseDto(details, true, "Account details fetched");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async updateAccountDetails(storeId: number, data: UpdateAccountDetailsDto) {
    try {
      const store = await this.StoreRepository.findByPk(storeId);
      if (!store) throw new NotFoundException();
      store.account_name_or_code = data.account_name_or_code;
      store.account_number = data.account_number;
      const updated = await store.save();
      const details = new StoreAccountDetailsDto(updated);
      return new DataResponseDto(details, true, "Account details updated");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async create(data: CreateNewStoreDto) {
    try {
      const result = await this.StoreRepository.sequelize.transaction(
        async (transaction: Transaction) => {
          // COMMENTED: Firebase OTP verification disabled
          // const guser = await this.firebaseService.verifyIdToken(data.idToken);
          // if (!guser?.phone_number) {
          //   throw new Error("Verification Failed. Please Retry@@");
          // }
          // const phoneNumber = guser?.phone_number?.replace(data.code, "");

          // Direct phone from request body (no Firebase verification)
          const phoneNumber = data?.phone || "";
          const store = new Store();
          store.name = `${data?.first_name} ${data?.last_name}`;
          store.email = data.email;
          store.password = data.password;
          store.business_location = String(data?.business_location || "");
          // store.business_type = data.business_type;
          store.agreement = data.agreement;
          store.trn_number = data.trn_number;
          store.is_prind_available = data.is_print_available;
          store.trade_lisc_no = data.trade_lisc_no;
          store.seller_name = data.seller_name;
          store.seller_country = data.seller_country;
          store.birth_country = data.birth_country;
          store.dob = data.dob;
          store.id_proof = data.id_proof;
          store.id_issue_country = data.id_issue_country;
          store.id_expiry_date = data.id_expiry_date;
          store.store_name = data.store_name;
          store.upscs = data.upscs;
          store.manufacture = data.manufacture;
          store.trn_upload = data.trn_upload;
          store.logo_upload =
            "https://bairuha-bucket.s3.ap-south-1.amazonaws.com/nextmiddleeast/profileicon.png";
          store.phone = phoneNumber;
          store.business_address = data.business_address;
          store.first_name = data.first_name;
          store.last_name = data.last_name;
          store.id_type = data.id_type;
          store.code = data.code;
          store.status = "pending";
          store.status_remark = "";
          store.order_count = 0;
          store.lat = data.lat;
          store.long = data.long;
          store.business_types = data.business_types;
          store.account_name_or_code = data.account_name_or_code;
          store.account_number = data.account_number;
          store.auto_approve_refund = data.auto_approve_refund;
          store.allow_refund = data.allow_refund;
          store.slug = this.slugify(data?.store_name);
          store.is_prind_available = data?.is_print_available;

          // Subscription plan fields - Look up plan by name if ID not provided
          let subscriptionPlanId = data.subscription_plan_id || null;
          const subscriptionPlanName =
            data.subscription_plan_name || "Standard Seller";

          // If plan name is provided but no ID, try to find the plan in database
          if (!subscriptionPlanId && subscriptionPlanName) {
            try {
              const planFromDb = await SubscriptionPlan.findOne({
                where: {
                  name: subscriptionPlanName,
                  is_active: true,
                },
              });
              if (planFromDb) {
                subscriptionPlanId = planFromDb.id;
                console.log(
                  `[StoreService.create] Found subscription plan by name: ${subscriptionPlanName}, ID: ${subscriptionPlanId}`
                );
              } else {
                console.warn(
                  `[StoreService.create] Subscription plan "${subscriptionPlanName}" not found in database`
                );
              }
            } catch (err) {
              console.error(
                "[StoreService.create] Error looking up subscription plan:",
                err
              );
            }
          }

          store.subscription_plan_id = subscriptionPlanId;
          store.subscription_plan = data.subscription_plan || "standard";
          store.subscription_plan_name = subscriptionPlanName;
          store.subscription_price = data.subscription_price || 0;
          store.subscription_boosts = data.subscription_boosts || 0;

          console.log("[StoreService.create] Storing subscription plan info:", {
            subscription_plan_id: subscriptionPlanId,
            subscription_plan_name: subscriptionPlanName,
            subscription_plan: store.subscription_plan,
            subscription_price: store.subscription_price,
            subscription_boosts: store.subscription_boosts,
          });

          const created = await store.save({ transaction });
          
          // Create PaystackSubaccount entry if bank details provided
          console.log('Checking for Paystack subaccount creation...', {
            settlement_bank: data.settlement_bank,
            settlement_account_number: data.settlement_account_number,
            settlement_account_name: data.settlement_account_name
          });
          
          if (data.settlement_bank && data.settlement_account_number) {
            const provisionalCode = this.generateProvisionalSubaccountCode();
            
            try {
              console.log('Creating PAYSTACK_SUBACCOUNTS entry for store:', created.id);
              await this.StoreRepository.sequelize.query(
                `INSERT INTO "PAYSTACK_SUBACCOUNTS" 
                (store_id, subaccount_code, business_name, settlement_bank, 
                settlement_account_number, settlement_account_name, 
                primary_contact_email, primary_contact_name, primary_contact_phone,
                percentage_charge, status, admin_approval_status, is_active,
                "createdAt", "updatedAt")
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 95.0, 'pending', 'pending', false, NOW(), NOW())`,
                {
                  replacements: [
                    created.id,
                    provisionalCode,
                    data.business_name || data.store_name,
                    data.settlement_bank,
                    data.settlement_account_number,
                    data.settlement_account_name,
                    data.email,
                    data.primary_contact_name || `${data.first_name} ${data.last_name}`,
                    data.primary_contact_phone || data.phone
                  ],
                  transaction
                }
              );

              console.log('✓ Subaccount request created with code:', provisionalCode);
            } catch (error) {
              console.error('Error creating subaccount request:', error);
            }
          }

          await this.userService.createSeller(
            created?.id,
            created,
            transaction
          );
          created.password = "";
          await created.save({ transaction });
          transaction.afterCommit(async () => {
            let adminEmail = await this.settingsService.getAdminEmail();
            let adminMail = await ToAdminCorporate(created, adminEmail);
            let userMail = await ToUserCorporate(created);
            this.mailService.sellerEmails(adminMail);
            this.mailService.sellerEmails(userMail);
            const user = await User.findOne({
              where: {
                store_id: created?.id,
              },
            });
            user.type = "seller";
            await user.save();
          });
          return created;
        }
      );

      return new DataResponseDto(
        result,
        true,
        "Seller Registration successfull."
      );
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  //to become a seler for an existing user
  async becomeSeller(userId: number, data: BecomeASellerDto) {
    try {
      const result = await this.StoreRepository.sequelize.transaction(
        async (transaction: Transaction) => {
          // COMMENTED: Firebase OTP verification disabled
          // const guser = await this.firebaseService.verifyIdToken(data.idToken);
          // if (!guser?.phone_number) {
          //   throw new Error("Verification Failed. Please Retry@@");
          // }
          // const phoneNumber = guser?.phone_number?.replace(data.code, "");

          // Direct phone from request body (no Firebase verification)
          const phoneNumber = data?.phone || "";
          const store = new Store();
          store.name = `${data?.first_name} ${data?.last_name}`;
          store.email = data.email;
          store.password = data.password;
          store.business_location = String(data.business_location);
          // store.business_type = data.business_type;
          store.agreement = data.agreement;
          store.trn_number = data.trn_number;
          store.trade_lisc_no = data.trade_lisc_no;
          store.is_prind_available = data.is_print_available;
          store.seller_name = data.seller_name;
          store.seller_country = data.seller_country;
          store.birth_country = data.birth_country;
          store.dob = data.dob;
          store.id_proof = data.id_proof;
          store.id_issue_country = data.id_issue_country;
          store.id_expiry_date = data.id_expiry_date;
          store.store_name = data.store_name;
          store.upscs = data.upscs;
          store.manufacture = data.manufacture;
          store.trn_upload = data.trn_upload;
          store.logo_upload =
            "https://bairuha-bucket.s3.ap-south-1.amazonaws.com/nextmiddleeast/profileicon.png";
          store.phone = phoneNumber;
          store.business_address = data.business_address;
          store.first_name = data.first_name;
          store.last_name = data.last_name;
          store.id_type = data.id_type;
          store.code = data.code;
          store.status = "pending";
          store.status_remark = "";
          store.order_count = 0;
          store.lat = data.lat;
          store.long = data.long;
          store.business_types = data.business_types;
          store.account_name_or_code = data.account_name_or_code;
          store.account_number = data.account_number;
          store.slug = this.slugify(data.store_name);

          // Subscription plan fields - Look up plan by name if ID not provided
          let subscriptionPlanId = data.subscription_plan_id || null;
          const subscriptionPlanName =
            data.subscription_plan_name || "Standard Seller";

          // If plan name is provided but no ID, try to find the plan in database
          if (!subscriptionPlanId && subscriptionPlanName) {
            try {
              const planFromDb = await SubscriptionPlan.findOne({
                where: {
                  name: subscriptionPlanName,
                  is_active: true,
                },
              });
              if (planFromDb) {
                subscriptionPlanId = planFromDb.id;
                console.log(
                  `[StoreService.becomeSeller] Found subscription plan by name: ${subscriptionPlanName}, ID: ${subscriptionPlanId}`
                );
              } else {
                console.warn(
                  `[StoreService.becomeSeller] Subscription plan "${subscriptionPlanName}" not found in database`
                );
              }
            } catch (err) {
              console.error(
                "[StoreService.becomeSeller] Error looking up subscription plan:",
                err
              );
            }
          }

          store.subscription_plan_id = subscriptionPlanId;
          store.subscription_plan = data.subscription_plan || "standard";
          store.subscription_plan_name = subscriptionPlanName;
          store.subscription_price = data.subscription_price || 0;
          store.subscription_boosts = data.subscription_boosts || 0;

          console.log(
            "[StoreService.becomeSeller] Storing subscription plan info:",
            {
              subscription_plan_id: subscriptionPlanId,
              subscription_plan_name: subscriptionPlanName,
              subscription_plan: store.subscription_plan,
              subscription_price: store.subscription_price,
              subscription_boosts: store.subscription_boosts,
            }
          );

          const created = await store.save({ transaction });
          
          // Create PaystackSubaccount entry if bank details provided
          console.log('Checking for Paystack subaccount creation in becomeSeller...', {
            settlement_bank: data.settlement_bank,
            settlement_account_number: data.settlement_account_number,
            settlement_account_name: data.settlement_account_name
          });
          
          if (data.settlement_bank && data.settlement_account_number) {
            const provisionalCode = this.generateProvisionalSubaccountCode();
            
            try {
              console.log('Creating PAYSTACK_SUBACCOUNTS entry for store:', created.id);
              await this.StoreRepository.sequelize.query(
                `INSERT INTO "PAYSTACK_SUBACCOUNTS" 
                (store_id, subaccount_code, business_name, settlement_bank, 
                settlement_account_number, settlement_account_name, 
                primary_contact_email, primary_contact_name, primary_contact_phone,
                percentage_charge, status, admin_approval_status, is_active,
                "createdAt", "updatedAt")
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 95.0, 'pending', 'pending', false, NOW(), NOW())`,
                {
                  replacements: [
                    created.id,
                    provisionalCode,
                    data.business_name || data.store_name,
                    data.settlement_bank,
                    data.settlement_account_number,
                    data.settlement_account_name,
                    data.email,
                    data.primary_contact_name || `${data.first_name} ${data.last_name}`,
                    data.primary_contact_phone || data.phone
                  ],
                  transaction
                }
              );

              console.log('✓ Subaccount request created with code:', provisionalCode);
            } catch (error) {
              console.error('Error creating subaccount request:', error);
            }
          }
          
          await this.userService.updateUserToSeller(
            created?.id,
            userId,
            transaction,
            data.password
          );
          transaction.afterCommit(async () => {
            let adminEmail = await this.settingsService.getAdminEmail();
            let adminMail = await ToAdminCorporate(created, adminEmail);
            let userMail = await ToUserCorporate(created);
            this.mailService.sellerEmails(adminMail);
            this.mailService.sellerEmails(userMail);
          });
          return created;
        }
      );

      return new DataResponseDto(
        result,
        true,
        "Seller Registration successfull."
      );
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async update(data: UpdateStoreDto, id: number) {
    try {
      const store = await this.StoreRepository.findByPk<Store>(id, {});
      if (!store) {
        throw new NotFoundException();
      }
      store.email = data.email;
      store.business_location = String(data.business_location);
      store.store_name = data.store_name;
      store.logo_upload = data.logo_upload;
      store.business_address = data.business_address;
      store.first_name = data.first_name;
      store.last_name = data.last_name;
      store.lat = data.lat;
      store.long = data.long;
      store.business_types = data.business_types;
      store.delivery_period = data.delivery_period;
      store.delivery_period_minutes = data.delivery_period_minutes;
      store.status = data?.status;
      store.cover_image = data?.cover_image;
      store.name = data?.name;
      store.description = data?.description;
      store.from = data?.from;
      store.to = data?.to;
      store.phone = data?.phone;
      store.code = data?.code;
      store.auto_approve_refund = data?.auto_approve_refund;
      store.allow_refund = data?.allow_refund;
      store.is_prind_available = data?.is_print_available;
      const updated = await store.save();
      return new DataResponseDto(updated);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async deactivateSeller(storeId: number) {
    try {
      const result = await this.StoreRepository.sequelize.transaction(
        async (transaction: Transaction) => {
          const store = await this.StoreRepository.findByPk(storeId, {
            transaction,
          });
          if (!store) throw new NotFoundException();
          if (store.status == "approved") {
            store.status = "cancelled";
          } else if (store.status == "cancelled") {
            store.status = "approved";
          }
          await store.save({ transaction });
          const user = await User.findOne({
            rejectOnEmpty: true,
            where: {
              store_id: storeId,
            },
            transaction,
          });
          if (store.status == "approved") {
            //remove from blacklist
            await this.cacheManager?.del(`store${storeId}`);
            user.role = Role.Seller;
          } else if (store.status == "cancelled") {
            await this.cacheManager?.set(`store${storeId}`, storeId);
            user.role = Role.User;
          }
          await user.save({ transaction });

          return { store };
        }
      );
      return new DataResponseDto(
        {},
        true,
        `Seller has been ${
          result?.store?.status == "approved" ? "Activated" : "Deactivated"
        } Successfully`
      );
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async updateStatus(id: number, data: UpdateStoreStatusDto) {
    try {
      /**
       * FAST, SAFE TRANSACTION (DB ONLY)
       */
      const updatedStore = await this.StoreRepository.sequelize.transaction(
        async (transaction: Transaction) => {
          const store = await Store.findByPk(id, { transaction });
          if (!store) {
            throw new HttpException("No ID found", HttpStatus.NOT_FOUND);
          }

          store.status = data.status;
          store.status_remark = data.status_remark;
          await store.save({ transaction });

          const user = await User.findOne({
            where: { store_id: id },
            transaction,
          });

          if (!user) {
            throw new NotFoundException("User not found for store");
          }

          if (store.status === "approved") {
            user.role = Role.Seller;
          } else if (store.status === "rejected") {
            user.role = Role.User;
          }

          await user.save({ transaction });

          return store;
        }
      );

      /**
       * ASYNC SIDE-EFFECTS (DO NOT BLOCK RESPONSE)
       */
      setImmediate(async () => {
        try {
          /* ===============================
            PAYSTACK SUBACCOUNT APPROVAL
          =============================== */
          if (updatedStore.status === "approved") {
            try {
              const subaccountRequest = await PaystackSubaccount.findOne({
                where: {
                  store_id: id,
                  admin_approval_status: "pending",
                },
              });

              if (subaccountRequest) {
                console.log(
                  "[StoreService.updateStatus] Auto-approving Paystack subaccount for store:",
                  id
                );

                await this.paystackSubaccountService.approveSubaccount(
                  subaccountRequest.id,
                  1 // TODO: replace with real admin ID from context if needed
                );

                console.log(
                  "[StoreService.updateStatus] ✓ Paystack subaccount approved"
                );
              }
            } catch (payErr) {
              console.error(
                "[StoreService.updateStatus] Paystack approval failed",
                payErr
              );
            }
          }

          /* ===============================
            EMAILS + NOTIFICATIONS
          =============================== */
          try {
            if (data.status === "approved") {
              const approvalMail = await ToUserApproval(updatedStore);
              this.mailService.sellerEmails(approvalMail);

              await this.notificationsService.createNotification(
                "seller_approval",
                "Your seller account has been approved.",
                "Seller Account Approved",
                updatedStore.id,
                undefined,
                updatedStore.logo_upload || undefined
              );
            }

            if (data.status === "rejected") {
              const rejectionMail = await ToUserRejection(updatedStore);
              this.mailService.sellerEmails(rejectionMail);
            }
          } catch (notifyErr) {
            console.error(
              "[StoreService.updateStatus] Notification/email error",
              notifyErr
            );
          }
        } catch (asyncErr) {
          console.error(
            "[StoreService.updateStatus] Async task failed",
            asyncErr
          );
        }
      });

      /**
       * IMMEDIATE RESPONSE
       */
      return new DataResponseDto(
        updatedStore,
        true,
        "Successfully Updated"
      );
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async reqestDocumentMail(data: RequestDocumentMailDto) {
    try {
      const seller = await this.StoreRepository.findByPk(data?.id);
      if (!seller) throw new NotFoundException();
      let requestDocumentMail = await RequestDocumentMail({
        ...data,
        to: seller.email,
      });
      const mail = await this.mailService.RequestDocumentMail(
        requestDocumentMail
      );
      return new DataResponseDto({}, true, "Email send successfully");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }
  async getSellerDashboardInfo(id: number) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const totalOrders = await Order.count({ where: { storeId: id } });
      const totalProducts = await Products.count({ where: { store_id: id } });
      const orderTotal = await Order.sum("grandTotal", {
        where: { storeId: id, status: "delivered" },
      });
      const data = await Order.findAll({
        where: {
          storeId: id,
          createdAt: {
            [Op.gte]: today,
            [Op.lt]: new Date(today.getTime() + 24 * 60 * 60 * 1000),
          },
        },
        include: [{ model: User, required: true, attributes: ["name"] }],
        order: [["createdAt", "DESC"]],
      });
      const orders = await Order.findAll({
        where: { storeId: id },
        attributes: [
          [
            Sequelize.fn("date_trunc", "day", Sequelize.col("createdAt")),
            "orderDate",
          ],
          [Sequelize.fn("count", "*"), "orderCount"],
        ],
        group: [Sequelize.fn("date_trunc", "day", Sequelize.col("createdAt"))],
        limit: 7,
        order: [["orderDate", "DESC"]],
      });
      const settled_amount =
        (await this.SettlementsRepository.sum("paid", {
          where: { storeId: id, status: "success" },
        })) ?? 0;
      console.log("therse are teh settled amount", settled_amount);
      const result = {
        statusCode: 200,
        status: true,
        message: "Fetched successfully",
        totalOrders,
        totalProducts,
        data,
        orderTotal,
        orders,
        settled_amount,
      };
      return result;
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }
  async getAdminDashboardInfo() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const totalOrders = await Order.count();
      const totalProducts = await Products.count({ where: { status: true } });
      const totalUsers = await User.count({ where: { status: true } });
      const totalSellers = await this.StoreRepository.count({
        where: { status: "approved" },
      });
      const data = await User.findAll({
        where: {
          createdAt: {
            [Op.gte]: today,
            [Op.lt]: new Date(today.getTime() + 24 * 60 * 60 * 1000),
          },
        },
        order: [["createdAt", "DESC"]],
      });
      const orders = await Order.findAll({
        attributes: [
          [
            Sequelize.fn("date_trunc", "day", Sequelize.col("createdAt")),
            "orderDate",
          ],
          [Sequelize.fn("count", "*"), "orderCount"],
        ],
        group: [Sequelize.fn("date_trunc", "day", Sequelize.col("createdAt"))],
        limit: 7,
        order: [["orderDate", "DESC"]],
      });
      const users = await User.findAll({
        attributes: [
          [
            Sequelize.fn("date_trunc", "day", Sequelize.col("createdAt")),
            "joinDate",
          ],
          [Sequelize.fn("count", "*"), "userCount"],
        ],
        group: [Sequelize.fn("date_trunc", "day", Sequelize.col("createdAt"))],
        limit: 7,
        order: [["joinDate", "DESC"]],
      });
      return {
        data,
        totalOrders,
        totalProducts,
        totalUsers,
        totalSellers,
        orders,
        statusCode: 200,
        message: "Success",
        status: true,
        users,
      };
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async getPrintTime(id) {
    try {
      const printTime = await this.StoreRepository.findOne({
        where: {
          id: id,
        },
        attributes: ["delivery_period_minutes"],
      });
      if (!printTime) {
        throw new NotFoundException("Print time not available for this store");
      }
      return new DataResponseDto(
        printTime,
        true,
        "Print time fetched successfully"
      );
    } catch (error) {
      throw new InternalServerErrorException(getErrorMessage(error));
    }
  }
}
