import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
} from "@nestjs/common";
import { LbhChargeService } from "./lbhcharge.service";
import { LbhChargeDto } from "./dto/lbhcharge.dto";
import { CreateLbhChargeDto } from "./dto/createLbhCharge.dto";
import { UpdateLbhChargeDto } from "./dto/updateLbhCharge.dto";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { ApiBearerAuth, ApiParam, ApiTags } from "@nestjs/swagger";
import { ApiDataArrayResponse } from "../shared/decorator/dto-dataArray.decorator";
import { ApiDataObjectResponse } from "../shared/decorator/dto-dataObject.decorator";

@Controller("lbhcharge")
@ApiTags("lbhcharge")
export class LbhChargeController {
  constructor(private readonly lbhChargeService: LbhChargeService) {}
}
