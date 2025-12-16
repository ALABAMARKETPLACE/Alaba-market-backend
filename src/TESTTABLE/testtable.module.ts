import { Module } from "@nestjs/common";
import { TestTableController } from "./testtable.controller";
import { TestTableService } from "./testtable.service";
import { TestTableProvider } from "./testtable.provider";

@Module({
  imports: [],
  controllers: [TestTableController],
  providers: [TestTableService, ...TestTableProvider],
  exports: [TestTableService],
})
export class TestTableModule {}
