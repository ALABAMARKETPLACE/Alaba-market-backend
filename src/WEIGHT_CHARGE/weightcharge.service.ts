import {
  Injectable,
  Inject,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
} from "@nestjs/common";
import { WeightCharge } from "./weightcharge.entity";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { CreateWeightChargeDto } from "./dto/createWeightCharge.dto";
import { UpdateWeightChargeDto } from "./dto/updateWeightCharge.dto";
import { WeightChargeDto } from "./dto/weightcharge.dto";
import { getErrorMessage } from "../shared/helpers/errormessage";

@Injectable()
export class WeightChargeService {
  constructor(
    @Inject("WeightChargeRepository")
    private readonly weightChargeRepository: typeof WeightCharge
  ) {}

}
