import { Module } from "@nestjs/common";
import { WishlistController } from "./wishlist.controller";
import { WishlistsService } from "./wishlist.service";
import { wishlistsProviders } from "./wishlist.provider";
import { WishlistRepository } from "./wishlist.repository";

@Module({
  imports: [],
  controllers: [WishlistController],
  providers: [WishlistsService, WishlistRepository, ...wishlistsProviders],
  exports: [],
})
export class WishlistsModule {}
