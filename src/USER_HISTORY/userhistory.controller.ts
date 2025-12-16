import {
  Controller,
  Get,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { UserHistoryService } from "./userhistory.service";
import { UserHistoryDto } from "./dto/userhistory.dto";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { ApiDataArrayResponse } from "../shared/decorator/dto-dataArray.decorator";
import { AuthGuard } from "../shared/guards/auth.guard";
import { UserId } from "../shared/decorator/userId_decorator";
import { PageOptionsDto } from "../shared/dto/pageOptions.dto";

@Controller("userhistory")
@ApiTags("userhistory")
export class UserHistoryController {
  constructor(private readonly userhistoryService: UserHistoryService) {}

  @UseGuards(AuthGuard)
  @Get("all")
  @ApiBearerAuth()
  @ApiDataArrayResponse(UserHistoryDto)
  @UsePipes(new ValidationPipe({ transform: true }))
  findAll(
    @UserId() userId: number,
    @Query() pageOpt: PageOptionsDto
  ): Promise<DataResponseDto> {
    return this.userhistoryService.findAll(userId, pageOpt);
  }
}
