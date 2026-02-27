import {
  BadRequestException,
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { getDistanceFromLatLonInKm } from "../shared/helpers/calculateDistance";
import { groupProductsByStore } from "../shared/helpers/groupProductsbystore";
import { CalculateDeliveryChargeDto } from "./dto/calculateDelivery.dto";
import { NewCalculateDeliveryDto } from "./dto/newCalculateDelivery.dto";
import { Store } from "../STORE/store.entity";
import { getErrorMessage } from "../shared/helpers/errormessage";
import { DistanceChargeService } from "../DISTANCE_CHARGE/distancecharge.service";
import { DistanceCharge } from "../DISTANCE_CHARGE/distancecharge.entity";
import { NewDistanceCharge } from "../NEW_DISTANCE_CHARGE/newdistancecharge.entity";
import { Transaction } from "sequelize";
import { DeliveryChargeService } from "../DELIVERY_CHARGE/deliverycharge.service";
import { JwtService } from "@nestjs/jwt";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { CalculateDeliveryPublicDto } from "./dto/calculateDeliveryPublic.dto";

@Injectable()
export class CalculateDeliveryChargeService {
  constructor(
    private readonly distanceChargeService: DistanceChargeService,
    private readonly deliveryChargeService: DeliveryChargeService,
    private readonly jwtService: JwtService,
  ) {}

  // async getDeliveryCharge(data: CalculateDeliveryChargeDto) {
  //   try {
  //     const groupedProducts = groupProductsByStore(data.cart);
  //     let amount: number = 0;
  //     const chargeDetails: any = {};
  //     //total delivery charge will be the sum of distance based charge + total product based charge for each order
  //     const result = await DistanceCharge.sequelize.transaction(
  //       async (transaction: Transaction) => {
  //         if (data.address?.lat && data.address?.long) {
  //           //this will work only if the user's address has lat and long info
  //           for (const store of groupedProducts) {
  //             const storeLocation = await Store.findByPk(store?.storeId, {
  //               attributes: ["lat", "long", "store_name", "default"],
  //               transaction,
  //             });
  //             if (storeLocation?.lat && storeLocation?.long) {
  //               const distance = getDistanceFromLatLonInKm(
  //                 data.address?.lat,
  //                 data.address?.long,
  //                 storeLocation.lat,
  //                 storeLocation.long
  //               );
  //               if (distance > 100 && storeLocation.default == true) {
  //                 throw new Error(
  //                   `Please Select your Dubai Address For Delivery to ${storeLocation.store_name}@@`
  //                 );
  //               } else if (distance > 100) {
  //                 throw new Error(
  //                   // `Delivery to Selected Address is not available for ${storeLocation.store_name}@@`
  //                    `Please select your nearest store location for ${storeLocation.store_name}.@@`
  //                 );
  //               }

  //               //calculating delvery charge based on distance between seller and user
  //               const charge =
  //                 await this.distanceChargeService.getDistanceCharge(
  //                   {
  //                     distance,
  //                   },
  //                   transaction
  //                 );
  //               //calculating delivery charge based on product total amount;
  //               const charge2 =
  //                 await this.deliveryChargeService.getDeliveryCharge(
  //                   { amount: data.total ?? 0 },
  //                   transaction
  //                 );
  //               //calculating the sum of both
  //               amount += charge + charge2;
  //               chargeDetails["distanceCharge"] = charge;
  //               chargeDetails["productCharge"] = charge2;
  //               chargeDetails["totalCharge"] = amount;
  //             } else {
  //               throw new Error(
  //                 "Unable to Calculate Delivery charge, Location is missing for Store@@"
  //               );
  //             }
  //           }

  //           return { amount, chargeDetails };
  //         }
  //         throw new Error(
  //           "Unable to Calculate Delivery charge, Location is missing in Address@@"
  //         );
  //       }
  //     );
  //     const discount = data.total > 100 ? (data.total / 100) * 10 : 0;
  //     const token = this.jwtService.sign(
  //       {
  //         data: {
  //           amount: result.amount,
  //           status: true,
  //           addressId: data?.address?.id,
  //           discount,
  //           tax: 0,
  //         },
  //       },
  //       { expiresIn: process.env.DELIVERY_TOKEN_EXPIRY }
  //     );
  //     return {
  //       data: {
  //         amount: result.amount,
  //         discount,
  //       },
  //       status: true,
  //       message: "Success",
  //       details: result.chargeDetails,
  //       statusCode: 200,
  //       token,
  //     };
  //   } catch (err) {
  //     console.log(err);
  //     if (err instanceof HttpException) throw err;
  //     throw new InternalServerErrorException(getErrorMessage(err));
  //   }
  // }

  async getDeliveryCharge(data: CalculateDeliveryChargeDto) {
    try {
      const groupedProducts = groupProductsByStore(data.cart);
      let amount: number = 0;
      const chargeDetails: any = {};
      //total delivery charge will be the sum of distance based charge + total product based charge for each order
      const result = await DistanceCharge.sequelize.transaction(
        async (transaction: Transaction) => {
          if (data.address?.lat && data.address?.long) {
            //this will work only if the user's address has lat and long info
            for (const store of groupedProducts) {
              const storeLocation = await Store.findByPk(store?.storeId, {
                attributes: ["lat", "long", "store_name", "default"],
                transaction,
              });
              if (storeLocation?.lat && storeLocation?.long) {
                const distance = getDistanceFromLatLonInKm(
                  data.address?.lat,
                  data.address?.long,
                  storeLocation.lat,
                  storeLocation.long,
                );
                // Get maximum configured distance from distance charges
                const maxDistanceCharge = await DistanceCharge.findOne({
                  attributes: ["distance"],
                  order: [["distance", "DESC"]],
                  transaction,
                });
                const maxDistance = maxDistanceCharge?.distance || 100000; // Default to 100000km if no charges configured

                if (distance > maxDistance && storeLocation.default == true) {
                  throw new Error(
                    `Please Select your Dubai Address For Delivery to ${storeLocation.store_name}@@`,
                  );
                } else if (distance > maxDistance) {
                  throw new Error(
                    `Please select your nearest store location for ${storeLocation.store_name}.@@`,
                  );
                }

                //calculating delvery charge based on distance between seller and user
                const charge =
                  await this.distanceChargeService.getDistanceCharge(
                    {
                      distance,
                    },
                    transaction,
                  );
                //calculating delivery charge based on product total amount;
                const charge2 =
                  await this.deliveryChargeService.getDeliveryCharge(
                    { amount: data.total ?? 0 },
                    transaction,
                  );
                //calculating the sum of both
                amount += charge + charge2;
                chargeDetails["distanceCharge"] = charge;
                chargeDetails["productCharge"] = charge2;
                chargeDetails["totalCharge"] = amount;
              } else {
                throw new Error(
                  "Unable to Calculate Delivery charge, Location is missing for Store@@",
                );
              }
            }

            return { amount, chargeDetails };
          }
          throw new Error(
            "Unable to Calculate Delivery charge, Location is missing in Address@@",
          );
        },
      );
      const discount = data.total > 100 ? (data.total / 100) * 10 : 0;
      const token = this.jwtService.sign(
        {
          data: {
            amount: result.amount,
            status: true,
            addressId: data?.address?.id,
            discount,
            tax: 0,
          },
        },
        { expiresIn: process.env.DELIVERY_TOKEN_EXPIRY },
      );
      return {
        data: {
          amount: result.amount,
          discount,
        },
        status: true,
        message: "Success",
        details: result.chargeDetails,
        statusCode: 200,
        token,
      };
    } catch (err) {
      console.log(err);
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  // New method for weight-based delivery charge calculation
  async getNewDeliveryCharge(data: NewCalculateDeliveryDto) {
    try {
      // Validate address has either country_id or state_id
      if (!data.address?.country_id && !data.address?.state_id) {
        throw new BadRequestException(
          "Address must have either country_id or state_id",
        );
      }

      // Calculate total weight from cart items
      const totalWeight = data.cart.reduce((sum, item) => {
        const quantity = item.quantity || 1;
        return sum + item.weight * quantity;
      }, 0);

      // UPDATED SECTION FOR ZERO DELIVERY FEE BWLO

      // Try to find delivery charge by state first, then by country
      let deliveryChargeRecord: NewDistanceCharge | null = null;

      if (data.address.state_id) {
        // Try to find by state_id
        deliveryChargeRecord = await NewDistanceCharge.findOne({
          where: {
            state_id: data.address.state_id,
          },
          attributes: ["id", "min_weight", "max_weight", "delivery_charge"],
        });

        // If found, check if weight is in range
        if (deliveryChargeRecord) {
          const records = await NewDistanceCharge.findAll({
            where: {
              state_id: data.address.state_id,
            },
            attributes: ["id", "min_weight", "max_weight", "delivery_charge"],
          });

          deliveryChargeRecord =
            records.find(
              (r) => r.min_weight <= totalWeight && totalWeight < r.max_weight,
            ) || null;
        }
      }

      // If no state match, try country
      if (!deliveryChargeRecord && data.address.country_id) {
        const records = await NewDistanceCharge.findAll({
          where: {
            country_id: data.address.country_id,
          },
          attributes: ["id", "min_weight", "max_weight", "delivery_charge"],
        });

        deliveryChargeRecord =
          records.find(
            (r) => r.min_weight <= totalWeight && totalWeight < r.max_weight,
          ) || null;
      }

      // ⚠️ TEMPORARY: Accept all addresses (admin approval check disabled)
      // TODO: Re-enable admin approval check after configuring delivery zones
      // if (!deliveryChargeRecord) {
      //   throw new BadRequestException(
      //     `Delivery not available for this location with weight ${totalWeight}kg. Please contact support.@@`,
      //   );
      // }

      // ✅ TEMPORARY: Use default delivery charge if none configured
      const deliveryCharge = deliveryChargeRecord?.delivery_charge || 0; // Default to 0 if no config
      console.log(
        "⚠️ [Delivery] Using default charge for unconfigured location:",
        {
          state_id: data.address.state_id,
          country_id: data.address.country_id,
          totalWeight,
          deliveryCharge,
          hasConfig: !!deliveryChargeRecord,
        },
      );

      // UPDATED SECTION FO ZERO DELIVERY FEE ABOVE

      // Calculate discount (same logic as old service)
      const cartTotal = data.cart.reduce((sum, item) => {
        return sum + item.weight * (item.quantity || 1);
      }, 0);
      const discount = cartTotal > 100 ? (cartTotal / 100) * 10 : 0;

      // Generate token with actual address ID for validation
      const token = this.jwtService.sign(
        {
          data: {
            amount: deliveryCharge,
            status: true,
            addressId: data.address?.id, // Use actual address ID from NEW_ADDRESS table
            discount,
            tax: 0,
            totalWeight,
          },
        },
        { expiresIn: process.env.DELIVERY_TOKEN_EXPIRY },
      );

      return {
        data: {
          amount: deliveryCharge,
          discount,
          totalWeight,
        },
        status: true,
        message: "Success",
        details: {
          totalCharge: deliveryCharge,
          weightCharge: deliveryCharge,
          discount,
        },
        statusCode: 200,
        token,
      };
    } catch (err) {
      console.log("Error calculating new delivery charge:", err);
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async getDeliveryChargePublic(data: CalculateDeliveryPublicDto) {
    try {
      // Transform guest DTO to match NewCalculateDeliveryDto structure
      const transformedData: NewCalculateDeliveryDto = {
        cart: data.cart.map((item) => ({
          ...item,
          userId: 0, // For cart item
          productId: item.productId || item.id,
          variantId: item.variantId || 0,
          image: "",
          productDetails: {
            image: "",
            name: item.name,
            price: item.totalPrice / item.quantity,
          },
          storeDetails: null,
          buyPrice: 0,
        })),
        address: {
          id: 0,
          country_id: data.address.country_id, // ← Add if missing
          state_id: data.address.state_id, // ← Add if missing
        },
        // total: data.total || 0,
      };

      // Reuse existing logic but modify token to include guest flag
      const result = await this.getNewDeliveryCharge(transformedData);

      // Re-sign token with guest flag
      const tokenData = this.jwtService.verify(result.token);
      const guestToken = this.jwtService.sign(
        {
          data: {
            ...tokenData.data,
            addressId: data.address.id, // Use guest address ID
            isGuest: true, // Add guest flag
          },
        },
        { expiresIn: process.env.DELIVERY_TOKEN_EXPIRY },
      );

      return new DataResponseDto(
        result.data,
        true,
        "Delivery charge calculated successfully",
        guestToken,
        null,
        false,
      );
    } catch (err) {
      console.log("Error calculating public delivery charge:", err);
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }
}
