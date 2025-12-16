import {
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";

import { CreatePaymentLogDto } from "./dto/paymentlog.create.dto";
import { PaymentLogDto } from "./dto/paymentlog.dto";
import { PaymentLogRepository } from "./paymentlog.repository";
import { getErrorMessage } from "../shared/helpers/errormessage";
import { DataResponseDto } from "../shared/dto/data-response-dto";

@Injectable()
export class PaymentLogService {
  constructor(private readonly PaymentLogRepository: PaymentLogRepository) {}

  async create(userId: number, data: CreatePaymentLogDto) {
    try {
      const paymentlog = await this.PaymentLogRepository.create(userId, data);
      if (!paymentlog) throw new InternalServerErrorException();
      const created = new PaymentLogDto(paymentlog);
      return new DataResponseDto(created, true, "Successfully Created");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }
}
