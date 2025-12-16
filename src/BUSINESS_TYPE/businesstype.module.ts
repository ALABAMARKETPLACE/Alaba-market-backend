import { Module } from "@nestjs/common";
import { BusinessTypeController } from "./businesstype.controller";
import { BusinessTypeService } from "./businesstype.service";
import { BusinessTypeProvider } from "./businesstype.provider";

@Module({
  imports: [],
  controllers: [BusinessTypeController],
  providers: [BusinessTypeService, ...BusinessTypeProvider],
  exports: [BusinessTypeService],
})
export class BusinessTypeModule {}
