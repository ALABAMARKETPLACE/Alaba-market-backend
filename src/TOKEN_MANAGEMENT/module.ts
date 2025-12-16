import { Module } from "@nestjs/common";
import { TokenManagementService } from "./services";
import { TokenMnagmentProvider } from "./provider";

@Module({
  imports: [],
  controllers: [],
  providers: [TokenManagementService, ...TokenMnagmentProvider],
  exports: [TokenManagementService],
})
export class TokenManagementModule {}
