import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, HttpCode } from "@nestjs/common";
import { WeightChargeService } from "./weightcharge.service";
import { WeightChargeDto } from "./dto/weightcharge.dto";
import { CreateWeightChargeDto } from "./dto/createWeightCharge.dto";
import { UpdateWeightChargeDto } from "./dto/updateWeightCharge.dto";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { ApiBearerAuth, ApiParam, ApiTags } from "@nestjs/swagger";
import { ApiDataArrayResponse } from "../shared/decorator/dto-dataArray.decorator";
import { ApiDataObjectResponse } from "../shared/decorator/dto-dataObject.decorator";

@Controller("weightcharge")
@ApiTags("weightcharge")
export class WeightChargeController {
  constructor(private readonly weightChargeService: WeightChargeService) {
  }

}
