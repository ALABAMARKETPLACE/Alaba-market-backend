import { Controller, Get, Param, ParseIntPipe } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOkResponse } from "@nestjs/swagger";
import { PrintStatusDto } from "./dto/printStatus.dto";
import { PrintStatusService } from "./print_status.service";

@Controller("printStatus")
@ApiTags("printStatus")
export class PrintStatusController {
  constructor(private readonly printService: PrintStatusService) {}
  @Get("all/:id")
  @ApiBearerAuth()
  @ApiOkResponse({ type: [PrintStatusDto] })
  findAll(@Param("id", ParseIntPipe) id: number): any {
    return this.printService.findAll(id);
  }
}
