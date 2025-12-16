import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseFloatPipe,
  Post,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { TestTableService } from "./testtable.service";

@Controller("testtable")
@ApiTags("testtable")
export class TestTableController {
  constructor(private readonly testtableService: TestTableService) {}
}
