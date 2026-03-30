import {
  Injectable,
  Inject,
  NotFoundException,
  HttpException,
  InternalServerErrorException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { CartTable } from "./cart.entity";
import { CreateCartDto } from "./dto/cart_create.dto";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { Op, Transaction } from "sequelize";
import { getErrorMessage } from "../shared/helpers/errormessage";
import { CartRepository } from "./cart.repository";
import { Products } from "../PRODUCTS/products.entity";
import { CartDataResponseDto } from "./dto/cart.dto";
import { InjectModel } from "@nestjs/sequelize";
import { ProductVariant } from "../PRODUCT_VARIANTS/productvariant.entity";

@Injectable()
export class CartServices {
  constructor(
    private readonly cartRepo: CartRepository,
    @InjectModel(CartTable)
    private readonly cartRepository: typeof CartTable
  ) {}

  async findByUserId(id: number) {
    try {
      const cart = await this.cartRepo.findAll(id);
      return new DataResponseDto(cart, true, "Success");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  // async create(userId: number, data: CreateCartDto) {
  //   try {
  //     const { cart, created }: any = await this.cartRepo.create(userId, data);
  //     const message = created
  //       ? "Successfully Added to cart"
  //       : `Changed Product Quantity to ${cart?.quantity}`;
  //     return new DataResponseDto(cart, true, message);
  //   } catch (err) {
  //     if (err instanceof HttpException) throw err;
  //     throw new InternalServerErrorException(getErrorMessage(err));
  //   }
  // }

  async create(userId: number, data: CreateCartDto) {
    try {
      let warningMessage = null;
      
      // First, check if user has existing cart items
      const existingCartItems = await CartTable.findAll({
        where: { userId },
        include: [
          {
            model: Products,
            as: 'productDetails',
            attributes: ['store_id']
          }
        ]
      });

      console.log({existingCartItems})

      // If there are existing items, check the store
      if (existingCartItems && existingCartItems.length > 0) {
        // Get all unique store IDs from existing cart items
        const existingStoreIds = [...new Set(
          existingCartItems.map(item => item.productDetails.store_id)
        )];
        
        // Get the product details for the new item being added
        const newProduct = await Products.findOne({
          where: {
            pid: data.productId
          },
          attributes: ['store_id']
        });
        
        if (!newProduct) {
          throw new NotFoundException('Product not found');
        }
        
        // Check if the new product's store is already in the cart or if there are already multiple stores
        const willHaveMultipleStores = existingStoreIds.length > 1 || 
                                      !existingStoreIds.includes(newProduct.store_id);
        
        if (willHaveMultipleStores) {
          // Set warning message but continue with adding to cart
          warningMessage = "Items from different stores are in your cart. You may not be eligible for discount offers and combined delivery charges.";
        }
      }

      // Proceed with normal cart creation regardless of store check
      const { cart, created }: any = await this.cartRepo.create(userId, data);
      console.log("userId, data", {userId, data});
      const message = created
        ? (warningMessage ? warningMessage : "Successfully Added to cart")
        : (warningMessage ? warningMessage : `Changed Product Quantity to ${cart?.quantity}`);
      
      // Return success response with warning if applicable
      return new CartDataResponseDto(
        cart, 
        true, 
        message,
        warningMessage ? 'DIFFERENT_STORE_WARNING' : null,
        warningMessage ? true : false  // isDifferentStore field
      );
    } catch (err) {
      console.log('error', err);
      if (err instanceof HttpException) throw err;

      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }


  async update(userId: number, id: number, action: string) {
    const where = { id, userId };
    try {
      const result = await this.cartRepository.sequelize.transaction(
        async (transaction: Transaction) => {
          let message = "";
          if (action == "add") {
            const currentCartItem = await CartTable.findOne({
              where,
              include: [
                {
                  model: Products,
                  as: "productDetails",
                  attributes: ["name", "status", "unit"],
                },
                {
                  model: ProductVariant,
                  as: "variantDetails",
                  attributes: ["id", "units"],
                  required: false,
                },
              ],
              transaction,
            });

            if (!currentCartItem) {
              throw new NotFoundException();
            }

            if (currentCartItem.productDetails?.status === false) {
              throw new ServiceUnavailableException("Product is not available");
            }

            const availableUnits = Number(
              currentCartItem.variantId
                ? currentCartItem.variantDetails?.units
                : currentCartItem.productDetails?.unit,
            );

            if (
              !Number.isFinite(availableUnits) ||
              availableUnits <= 0 ||
              Number(currentCartItem.quantity || 0) >= Math.min(25, availableUnits)
            ) {
              throw new ServiceUnavailableException("Product is out of stock");
            }

            const { count, data }: any = await this.cartRepo.updateCart(
              where,
              1,
              transaction
            );
            if (count == 0) throw new NotFoundException();
            message = `You have Changed the quantity to ${data?.[0]?.quantity}`;
          } else if (action == "reduce") {
            const { count, data }: any = await this.cartRepo.updateCart(
              where,
              -1,
              transaction
            );
            if (count == 0) throw new NotFoundException();
            message = `You have Changed the quantity to ${data?.[0]?.quantity}`;
            if (data?.[0]?.quantity < 1) {
              const deleted = await this.cartRepo.removeOne(where, transaction);
              if (deleted == 1)
                message = "You have removed the Product from Cart";
            }
          }
          return message;
        }
      );
      return new DataResponseDto({}, true, result);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async delete(userId: number, id: number) {
    try {
      const deleted = await this.cartRepo.deleteCart(userId, id);
      const message = "Successfully Removed item from cart";
      return new DataResponseDto({}, true, message);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async removeFromCart(data: number[]) {
    try {
      const deleted = await this.cartRepository.destroy({
        where: {
          id: { [Op.in]: data },
        },
      });
      return deleted;
    } catch (err) {}
  }
  
  async clearCart(userId: number) {
    try {
      const cleared = await this.cartRepo.removeAll(userId);
      return new DataResponseDto(cleared, true, "Cart Cleared Successfully.");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }
}
