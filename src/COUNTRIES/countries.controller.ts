import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import { Countries } from "./countries.entity";
import { CountriesDto } from "./dto/countries.dto";
import { CountriesService } from "./countries.service";
import { CreateCountriesDto } from "./dto/create.dto";
import { UpdateCountriesDto } from "./dto/updateCountries.dto";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { AuthGuard } from "../shared/guards/auth.guard";
import { Roles } from "../shared/decorator/roles.decorator";
import { Role } from "../shared/enum/role.enum";

@Controller("countries")
@ApiTags("countries")
export class CountriesController {
  constructor(private readonly countriesService: CountriesService) {}

  // Get all countries

  @Get()
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOkResponse({ type: [CountriesDto] })
  findAll(): Promise<DataResponseDto> {
    return this.countriesService.findAll();
  }

  // Get one country by ID

  @Get(":id")
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiParam({ name: "id", required: true })
  @ApiOkResponse({ type: CountriesDto })
  findOne(
    @Param("id", new ParseIntPipe()) id: number
  ): Promise<DataResponseDto> {
    return this.countriesService.findOne(id);
  }

  // Create new country
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Post()
  @ApiCreatedResponse({ type: Countries })
  @HttpCode(201)
  @ApiBearerAuth()
  create(
    @Body() createCountriesDto: CreateCountriesDto
  ): Promise<DataResponseDto> {
    return this.countriesService.create(createCountriesDto);
  }

  // Update country
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Put(":id")
  @ApiOkResponse({ type: Countries })
  @ApiParam({ name: "id", required: true })
  @ApiBearerAuth()
  @HttpCode(200)
  update(
    @Param("id", new ParseIntPipe()) id: number,
    @Body() body: UpdateCountriesDto
  ): Promise<DataResponseDto> {
    return this.countriesService.update(id, body);
  }

  // Delete country (soft delete)
  @Roles(Role.Admin)
  @UseGuards(AuthGuard)
  @Delete(":id")
  @ApiOkResponse({ type: Countries })
  @ApiParam({ name: "id", required: true })
  @ApiBearerAuth()
  @HttpCode(200)
  delete(
    @Param("id", new ParseIntPipe()) id: number
  ): Promise<DataResponseDto> {
    return this.countriesService.delete(id);
  }
}
