import { HttpException, Injectable, InternalServerErrorException} from "@nestjs/common";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { Transaction } from "sequelize";
import { PrintStatus } from "./print_status.entity";
import { getErrorMessage } from "../shared/helpers/errormessage";
import { PrintDto } from "../PRINT/dto/print.dto";
import { ErrorCodes } from "../shared/constants/errorcode";

@Injectable()
export class PrintStatusService {
  async findAll(userId: number) {
    try {
      const allList = await PrintStatus.findAll<PrintStatus>({
        order: [["updatedAt", "DESC"]],
      });
      return new DataResponseDto(allList, true, "success");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }
  async create(item: PrintDto, remark: string, transaction: Transaction) {
    try {
      const printStatus = new PrintStatus();
      printStatus.printId = item.id;
      printStatus.status = item.status;
      printStatus.remark = remark;
      const data = await printStatus.save({ transaction: transaction });
      return data;
    } catch (err) {
      throw new Error(getErrorMessage(err) + ErrorCodes.orderStatus + "@@");
    }
  }
}
