import { Module } from "@nestjs/common";
import { CartController } from "./cart.controller";
import { CartServices } from "./cart.services";
import { CartProvider } from "./cart.provider";
import { CartRepository } from "./cart.repository";

@Module({
  imports: [],
  controllers: [CartController],
  providers: [CartServices, CartRepository, ...CartProvider],
  exports: [CartServices],
})
export class CartModule {}
