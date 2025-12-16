import { Module } from "@nestjs/common";
import { EmailModule } from "../MAILS/Mails.module";
import { SettingsModule } from "../SETTINGS/settings.module";
import { SettlementsModule } from "../SETTLEMENTS/settlements.module";
import { UserModule } from "../USERS/user.module";
import { RefundRequestController } from "./refund-request.controller";
import { RefundRequestService } from "./refund-request.service";
import { RefundRequestProvider } from "./refund-request.provider";

@Module({
  imports: [UserModule, EmailModule, SettingsModule, SettlementsModule],
  controllers: [RefundRequestController],
  providers: [RefundRequestService, ...RefundRequestProvider],
  exports: [RefundRequestService],
})
export class RefundRequestModule {}
