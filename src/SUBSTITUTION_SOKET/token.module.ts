import { Module } from "@nestjs/common";
import { TokenGateway } from "./token.gateway";
import { TokenController } from "./token.controller";

@Module({
  controllers: [TokenController],
  providers: [TokenGateway],
  exports: [TokenGateway],
})
export class TokenGatewayModule {}
