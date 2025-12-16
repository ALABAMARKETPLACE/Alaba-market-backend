import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { TestTable } from "./testtable.entity";

@Injectable()
export class TestTableService {
  constructor(
    @Inject("TestTableRepository")
    private readonly TestTableRepository: typeof TestTable
  ) {}
}
