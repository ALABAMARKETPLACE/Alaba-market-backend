import { HttpException, Injectable, InternalServerErrorException} from "@nestjs/common";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { Transaction } from "sequelize";
import { OrderStatus } from "./order_status.entity";
import { getErrorMessage } from "../shared/helpers/errormessage";
import { OrderDto } from "../ORDER/dto/order.dto";
import { ErrorCodes } from "../shared/constants/errorcode";

@Injectable()
export class OrderStatusService {
  async findAll(userId: number) {
    try {
      const allList = await OrderStatus.findAll<OrderStatus>({
        order: [["updatedAt", "DESC"]],
      });
      return new DataResponseDto(allList, true, "success");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }
  async create(item: OrderDto, remark: string, transaction: Transaction) {
    try {
      const orderStatus = new OrderStatus();
      orderStatus.orderId = item.id;
      orderStatus.status = item.status;
      orderStatus.remark = remark;
      const data = await orderStatus.save({ transaction: transaction });
      return data;
    } catch (err) {
      throw new Error(getErrorMessage(err) + ErrorCodes.orderStatus + "@@");
    }
  }
}
