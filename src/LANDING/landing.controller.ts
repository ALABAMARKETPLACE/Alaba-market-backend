import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";

import { LandingService } from "./landing.service";
import { BannerDto } from "../BANNER/dto/banner.dto";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { LandingBannerDto } from "./dto/banner.dto";

@Controller("landing")
@ApiTags("landing")
export class LandingController {
  constructor(private readonly landingService: LandingService) {}

  @Get()
  @ApiBearerAuth()
  @ApiOkResponse({ type: [BannerDto] })
  findBanners(@Query() latlong: LandingBannerDto): Promise<DataResponseDto> {
    return this.landingService.findBanners(latlong);
  }
}
