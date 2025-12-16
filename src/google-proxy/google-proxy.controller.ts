import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { GoogleProxyService } from "./google-proxy.service";
import { GooglePlacePickerDto } from "./dto/queryParams";
import { AutoCompleteDto } from "./dto/autoComplete";

@Controller("google-proxy")
export class GoogleProxyController {
  constructor(private readonly proxyService: GoogleProxyService) {}

  @Get("placepicker")
  @UsePipes(new ValidationPipe({ transform: true }))
  placePicker(@Query() query: GooglePlacePickerDto): any {
    return this.proxyService.placePicker(query);
  }

  @Get("autocomplete")
  @UsePipes(new ValidationPipe({ transform: true }))
  autoComplete(@Query() query: AutoCompleteDto): Promise<any> {
    return this.proxyService.autoComplete(query);
  }
}
