import { Injectable } from "@nestjs/common";
import { Transaction } from "sequelize";
import { OrderPayments } from "./order_payments.entity";
import { CreateOrderDto } from "../ORDER/dto/createOrder.dto";
import { PaymentGateWayService } from "../PAYMENT_GATEWAY/payment_gateway.service";

@Injectable()
export class OrderPaymentsService {
  constructor(private readonly paymentGatewayService: PaymentGateWayService) {}
}
