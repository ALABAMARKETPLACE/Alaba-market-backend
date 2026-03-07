import {
  Body,
  Controller,
  Get,
  Delete,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Put,
  Patch,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Enquiry } from "./enquiry.entity";
import { EnquiryDto } from "./dto/enquiry.dto";
import { EnquiryService } from "./enquiry.service";
import { CreateEnquiryDto } from "./dto/create.dto";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { Roles } from "../shared/decorator/roles.decorator";
import { Role } from "../shared/enum/role.enum";
import { AuthGuard } from "../shared/guards/auth.guard";
import { PageOptionsDto } from "../shared/dto/pageOptions.dto";
import { EnquirySearchDto } from "./dto/querySearch.dto";

@Controller("Enquiry")
@ApiTags("Enquiry")
export class EnquiryController {
  constructor(private readonly EnquiryService: EnquiryService) {}

  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  @Get("get")
  @ApiOkResponse({ type: [EnquiryDto] })
  findAll(@Query() pageOpt: EnquirySearchDto): Promise<DataResponseDto> {
    return this.EnquiryService.findAll(pageOpt);
  }

  @Post("post")
  @ApiCreatedResponse({ type: [Enquiry] })
  @ApiBearerAuth()
  create(@Body() createEnquiryDto: CreateEnquiryDto): Promise<DataResponseDto> {
    return this.EnquiryService.create(createEnquiryDto);
  }

  @UseGuards(AuthGuard)
  @Put("update/:id")
  @ApiCreatedResponse({ type: [Enquiry] })
  @ApiBearerAuth()
  update(
    @Param("id", new ParseIntPipe()) id: number,
    @Body() createEnquiryDto: CreateEnquiryDto
  ): Promise<DataResponseDto> {
    return this.EnquiryService.update(id, createEnquiryDto);
  }

  @UseGuards(AuthGuard)
  @Patch("patch/:id")
  @ApiCreatedResponse({ type: [Enquiry] })
  @ApiBearerAuth()
  patch(
    @Param("id", new ParseIntPipe()) id: number,
    @Body() createEnquiryDto: CreateEnquiryDto
  ): Promise<DataResponseDto> {
    return this.EnquiryService.patch(id, createEnquiryDto);
  }

  @UseGuards(AuthGuard)
  @Delete("delete/:id")
  @ApiCreatedResponse({ type: [Enquiry] })
  @ApiBearerAuth()
  delete(
    @Param("id", new ParseIntPipe()) id: number
  ): Promise<DataResponseDto> {
    return this.EnquiryService.delete(id);
  }
}
