import { Module } from "@nestjs/common";
import { UserHistoryController } from "./userhistory.controller";
import { UserHistoryService } from "./userhistory.service";
import { UserHistoryProvider } from "./userhistory.provider";

@Module({
  imports: [],
  controllers: [UserHistoryController],
  providers: [UserHistoryService, ...UserHistoryProvider],
  exports: [UserHistoryService],
})
export class UserHistoryModule {}
