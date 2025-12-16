import { Injectable, Inject, HttpException, HttpStatus, InternalServerErrorException } from "@nestjs/common";
import { LbhCharge } from "./lbhcharge.entity";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { CreateLbhChargeDto } from "./dto/createLbhCharge.dto";
import { UpdateLbhChargeDto } from "./dto/updateLbhCharge.dto";
import { LbhChargeDto } from "./dto/lbhcharge.dto";
import { getErrorMessage } from "../shared/helpers/errormessage";

@Injectable()
export class LbhChargeService {
  constructor(
    @Inject("LbhChargeRepository")
    private readonly lbhChargeRepository: typeof LbhCharge
  ) {}

}
