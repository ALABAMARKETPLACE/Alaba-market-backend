import {
  Injectable,
  HttpException,
  HttpStatus,
  // Inject,
  InternalServerErrorException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { PaystackSubaccount } from "./paystack-subaccount.entity";
import { Store } from "../STORE/store.entity";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { getErrorMessage } from "../shared/helpers/errormessage";
import { Transaction } from "sequelize";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";

@Injectable()
export class PaystackSubaccountService {
  private readonly paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
  private readonly paystackBaseUrl = "https://api.paystack.co";

  constructor(
  @InjectModel(PaystackSubaccount)
  private readonly paystackSubaccountRepository: typeof PaystackSubaccount,

  @InjectModel(Store)
  private readonly storeRepository: typeof Store,

  private readonly httpService: HttpService,
) {}

  // Generate provisional subaccount code
  private generateProvisionalCode(): string {
    const timestamp = Date.now().toString().slice(-6);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `ACCT_${randomStr}${timestamp}`;
  }

  // Create subaccount request (pending admin approval)
  async createSubaccountRequest(storeId: number, subaccountData: any): Promise<DataResponseDto> {
    try {
      return await this.storeRepository.sequelize.transaction(
        async (transaction: Transaction) => {
          // Check if store exists and doesn't already have a subaccount
          const store = await this.storeRepository.findByPk(storeId, {
            transaction,
          });
          if (!store) {
            throw new HttpException("Store not found", HttpStatus.NOT_FOUND);
          }

          // Check if subaccount already exists for this store
          const existingSubaccount = await this.paystackSubaccountRepository.findOne({
            where: { store_id: storeId },
            transaction,
          });
          if (existingSubaccount) {
            throw new HttpException(
              "Subaccount request already exists for this store",
              HttpStatus.CONFLICT
            );
          }

          // Generate provisional code
          const provisionalCode = this.generateProvisionalCode();

          // Create subaccount record with pending status
          const subaccountRequest = await this.paystackSubaccountRepository.create(
            {
              store_id: storeId,
              subaccount_code: provisionalCode,
              business_name: subaccountData.business_name || store.store_name,
              settlement_bank: subaccountData.settlement_bank,
              settlement_account_number: subaccountData.settlement_account_number,
              settlement_account_name: subaccountData.settlement_account_name,
              primary_contact_email: subaccountData.primary_contact_email || store.email,
              primary_contact_name: subaccountData.primary_contact_name || store.name,
              primary_contact_phone: subaccountData.primary_contact_phone || store.phone,
              percentage_charge: 95.0, // Seller gets 95%, Admin gets 5%
              status: "pending",
              admin_approval_status: "pending",
              is_active: false,
            },
            { transaction }
          );

          // Update store with pending subaccount info
          await store.update(
            {
              paystack_subaccount_code: provisionalCode,
              subaccount_status: "pending",
              business_name: subaccountData.business_name || store.store_name,
              settlement_bank: subaccountData.settlement_bank,
              settlement_account_number: subaccountData.settlement_account_number,
              settlement_account_name: subaccountData.settlement_account_name,
              primary_contact_email: subaccountData.primary_contact_email || store.email,
              primary_contact_name: subaccountData.primary_contact_name || store.name,
              primary_contact_phone: subaccountData.primary_contact_phone || store.phone,
            },
            { transaction }
          );

          return {
            status: true,
            statusCode: HttpStatus.CREATED,
            message: "Subaccount request created successfully",
            data: subaccountRequest
          };
        }
      );
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  // Admin approves subaccount and creates it in Paystack
  async approveSubaccount(subaccountId: number, adminUserId: number): Promise<DataResponseDto> {
    try {
      return await this.storeRepository.sequelize.transaction(
        async (transaction: Transaction) => {
          // Get subaccount request
          const subaccount = await this.paystackSubaccountRepository.findByPk(
            subaccountId,
            {
              include: [{ model: Store }],
              transaction,
            }
          );

          if (!subaccount) {
            throw new HttpException(
              "Subaccount request not found",
              HttpStatus.NOT_FOUND
            );
          }

          if (subaccount.admin_approval_status !== "pending") {
            throw new HttpException(
              "Subaccount request already processed",
              HttpStatus.CONFLICT
            );
          }

          // Create subaccount in Paystack
          const paystackResponse = await this.createPaystackSubaccount(subaccount);

          // Update subaccount record
          await subaccount.update(
            {
              paystack_subaccount_id: paystackResponse.data.subaccount_code,
              status: "active",
              admin_approval_status: "approved",
              admin_approved_by: adminUserId,
              admin_approved_at: new Date(),
              paystack_response: paystackResponse.data,
              is_active: true,
            },
            { transaction }
          );

          // Update store record
          await subaccount.store.update(
            {
              paystack_subaccount_id: paystackResponse.data.id,
              paystack_subaccount_code: paystackResponse.data.subaccount_code,
              subaccount_status: "active",
            },
            { transaction }
          );

          return {
            status: true,
            statusCode: HttpStatus.OK,
            message: "Subaccount approved successfully",
            data: subaccount
          };
        }
      );
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  // Create subaccount in Paystack via API
  private async createPaystackSubaccount(subaccount: PaystackSubaccount) {
    try {
      const payload = {
        business_name: subaccount.business_name,
        settlement_bank: subaccount.settlement_bank,
        account_number: subaccount.settlement_account_number,
        percentage_charge: subaccount.percentage_charge,
        description: `Subaccount for ${subaccount.business_name}`,
        primary_contact_email: subaccount.primary_contact_email,
        primary_contact_name: subaccount.primary_contact_name,
        primary_contact_phone: subaccount.primary_contact_phone,
        settlement_schedule: subaccount.settlement_schedule,
      };

      const response = await firstValueFrom(
        this.httpService.post(`${this.paystackBaseUrl}/subaccount`, payload, {
          headers: {
            Authorization: `Bearer ${this.paystackSecretKey}`,
            "Content-Type": "application/json",
          },
        })
      );

      if (!response.data.status) {
        throw new Error(`Paystack API Error: ${response.data.message}`);
      }

      return response.data;
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to create Paystack subaccount: ${error.message}`
      );
    }
  }

  // Calculate payment split amounts
  calculateSplit(totalAmount: number, adminPercentage: number = 5) {
    const adminAmount = (totalAmount * adminPercentage) / 100;
    const sellerAmount = totalAmount - adminAmount;
    
    return {
      total: totalAmount,
      adminAmount: Math.round(adminAmount * 100) / 100, // Round to 2 decimal places
      sellerAmount: Math.round(sellerAmount * 100) / 100,
      adminPercentage,
      sellerPercentage: 100 - adminPercentage,
    };
  }

  // Get all pending subaccount requests for admin
  async getPendingSubaccounts() {
    try {
      const pendingSubaccounts = await this.paystackSubaccountRepository.findAll({
        where: { admin_approval_status: "pending" },
        include: [{ model: Store }],
        order: [["createdAt", "DESC"]],
      });

      return new DataResponseDto(
        pendingSubaccounts,
        true,
        "Pending subaccounts fetched successfully"
      );
    } 
    // catch (err) {
    //   throw new InternalServerErrorException(getErrorMessage(err));
    // }
      catch (error) {
      console.error("ERROR in getPendingSubaccounts:", error);
      throw error; // rethrow so Nest handles it
    }
  }

  // Get subaccount by store ID
  async getSubaccountByStore(storeId: number) {
    try {
      const subaccount = await this.paystackSubaccountRepository.findOne({
        where: { store_id: storeId },
        include: [{ model: Store }],
      });

      return new DataResponseDto(
        subaccount,
        true,
        "Subaccount fetched successfully"
      );
    } catch (err) {
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  // Reject subaccount request
  async rejectSubaccount(subaccountId: number, adminUserId: number, reason?: string) {
    try {
      const subaccount = await this.paystackSubaccountRepository.findByPk(subaccountId);
      
      if (!subaccount) {
        throw new HttpException("Subaccount not found", HttpStatus.NOT_FOUND);
      }

      await subaccount.update({
        admin_approval_status: "rejected",
        admin_approved_by: adminUserId,
        admin_approved_at: new Date(),
        paystack_response: { rejection_reason: reason || "Rejected by admin" } as any,
      });

      // Update store status
      const store = await this.storeRepository.findByPk(subaccount.store_id);
      if (store) {
        await store.update({ subaccount_status: "rejected" });
      }

      return new DataResponseDto(subaccount, true, "Subaccount rejected successfully");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  // Get list of Paystack supported banks
  async getSupportedBanks() {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.paystackBaseUrl}/bank`, {
          headers: {
            Authorization: `Bearer ${this.paystackSecretKey}`,
          },
        })
      );

      if (!response.data.status) {
        throw new Error(`Paystack API Error: ${response.data.message}`);
      }

      return new DataResponseDto(
        response.data.data,
        true,
        "Supported banks fetched successfully"
      );
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to fetch supported banks: ${error.message}`
      );
    }
  }

  // Validate bank account details with Paystack
  async validateBankAccount(accountNumber: string, bankCode: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.paystackBaseUrl}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
          {
            headers: {
              Authorization: `Bearer ${this.paystackSecretKey}`,
            },
          }
        )
      );

      if (!response.data.status) {
        throw new HttpException(
          response.data.message || "Invalid bank account details",
          HttpStatus.BAD_REQUEST
        );
      }

      return new DataResponseDto(
        response.data.data,
        true,
        "Bank account validated successfully"
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      
      // Handle specific Paystack errors
      if (error.response?.data?.message) {
        throw new HttpException(
          error.response.data.message,
          HttpStatus.BAD_REQUEST
        );
      }
      
      throw new InternalServerErrorException(
        `Failed to validate bank account: ${error.message}`
      );
    }
  }

  // Validate if bank code is supported by Paystack
  async isBankSupported(bankCode: string) {
    try {
      const banksResponse = await this.getSupportedBanks();
      const supportedBanks = banksResponse.data;
      
      const bank = supportedBanks.find((bank: any) => bank.code === bankCode);
      
      return new DataResponseDto(
        {
          supported: !!bank,
          bank: bank || null,
        },
        true,
        bank ? "Bank is supported" : "Bank is not supported by Paystack"
      );
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to check bank support: ${error.message}`
      );
    }
  }
}