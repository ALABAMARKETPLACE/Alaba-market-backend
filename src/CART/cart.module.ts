import { Module } from "@nestjs/common";
import { CartController } from "./cart.controller";
import { CartServices } from "./cart.services";
import { CartRepository } from "./cart.repository";
import { SequelizeModule } from "@nestjs/sequelize";
import { CartTable } from "./cart.entity";

@Module({
  imports: [
    SequelizeModule.forFeature([CartTable]),
  ],
  controllers: [CartController],
  providers: [CartServices, CartRepository],
  exports: [CartServices],
})
export class CartModule {}
