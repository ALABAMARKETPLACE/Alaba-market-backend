import { Injectable, Inject, NotFoundException } from "@nestjs/common";
import { PaymentLog } from "./paymentlog.entity";
import { PageOptionsDto } from "../shared/dto/pageOptions.dto";
import { CreatePaymentLogDto } from "./dto/paymentlog.create.dto";
import { UpdatePaymentLogDto } from "./dto/paymentlog.update.dto";

@Injectable()
export class PaymentLogRepository {
  constructor(
    @Inject("PaymentLogRepository")
    private readonly PaymentLogRepo: typeof PaymentLog
  ) {}

  async create(userId:number,data: CreatePaymentLogDto) {
    try {
      const paymentlog = this.PaymentLogRepo.create({
        userId: userId,
        addressId: data.addressId,
        cart: data.cart,
        ref: data.ref,
        charges: data.charges,
      });
      return paymentlog;
    } catch (err) {
      throw err;
    }
  }
}
