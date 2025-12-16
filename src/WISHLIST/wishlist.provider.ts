import { Wishlist } from "./wishlist.entity";

export const wishlistsProviders: any[] = [
  { provide: "WishlistRepository", useValue: Wishlist },
  //   {
  //     provide: "removeWishlist",
  //     useFactory:
  //       (wishlistRepository: typeof Wishlist) =>
  //       async (userId: number, id: number) => {
  //         try {
  //           const wishlist = await wishlistRepository.destroy({
  //             where: {
  //               id,
  //               userId,
  //             },
  //           });
  //           if (wishlist === 0) {
  //             throw new NotFoundException("Wishlist item not found");
  //           }
  //           return wishlist;
  //         } catch (error) {
  //           throw error;
  //         }
  //       },
  //     inject: ["WishlistRepository"],
  //   },
];
