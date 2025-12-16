import { Inject, Injectable } from "@nestjs/common";
import { OrderLog } from "./orderlog.entity";
import { CreateOrderDto } from "../ORDER/dto/createOrder.dto";

@Injectable()
export class OrderLoggingService {
  constructor(
    @Inject("OrderLogRepository")
    private readonly orderLogRepository: typeof OrderLog
  ) {}

  async create(userId: number, create: CreateOrderDto) {
    try {
      const log = await this.orderLogRepository.create({
        userId,
        address: create?.address,
        cart: create?.cart,
        payment: create?.payment,
        charges: create?.charges,
      });
      return log;
    } catch (err) {
      return null;
    }
  }
}
