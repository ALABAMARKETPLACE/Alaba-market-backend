import {
  HttpException,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { CreateWishlistDto } from "./dto/create-wishlist.dto";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { getErrorMessage } from "../shared/helpers/errormessage";
import { PageOptionsDto } from "../shared/dto/pageOptions.dto";
import { WishlistRepository } from "./wishlist.repository";

@Injectable()
export class WishlistsService {
  constructor(private readonly wishListRepo: WishlistRepository) {}

  async findAllWithUserId(userId: number, pag: PageOptionsDto) {
    try {
      const { rows, count }: any = await this.wishListRepo.getAllWishList(
        userId,
        pag
      );
      return new DataResponseDto(rows, true, "Success", pag, count);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async create(userId: number, create: CreateWishlistDto) {
    try {
      const { wishlist, created }: any = await this.wishListRepo.addtoWishlist(
        userId,
        create
      );
      const message =
        created == true
          ? `Successfully added to Wishlist`
          : "Item Removed from Wishlist.";
      return new DataResponseDto(wishlist, true, message);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async delete(userId: number, id: number) {
    try {
      const wishlist = await this.wishListRepo.removeWishlist(userId, id);
      return new DataResponseDto({}, true, "Item removed from Wishlist");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }
}
