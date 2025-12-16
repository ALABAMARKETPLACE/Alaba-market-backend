import {
  HttpException,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { Observable, catchError, lastValueFrom, map } from "rxjs";
import { AxiosResponse } from "axios";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { CreateOrderType } from "./dto/createOrder.dto";
import { GetOrderDetails } from "./dto/getOrderDetails.dto";
import { CreateRefundDto } from "./dto/refund.dto";
import { getErrorMessage } from "../shared/helpers/errormessage";

@Injectable()
export class PaymentGateWayService {
  constructor(private readonly httpService: HttpService) {}

  async createtoken(): Promise<Observable<AxiosResponse<any, any>>> {
    try {
      const response = this.httpService
        .post(
          process.env.GET_TOKEN,
          {},
          {
            headers: {
              "Content-Type": "application/vnd.ni-identity.v1+json",
              Authorization: `Basic ${process.env.ACCESS_TOKEN}`,
            },
          }
        )
        .pipe(
          map((resp) => resp.data),
          catchError((e) => {
            console.log("err = = = = >1 ", e);
            throw new HttpException(e.response.data, e.response.status);
          })
        );
      return response;
    } catch (err) {
      console.log("err = = = => 2", err);
      return;
    }
  }

  async getAccessToken(): Promise<string> {
    try {
      const tokenObservable = await this.createtoken();
      const tokenResponse: any = await lastValueFrom(tokenObservable);

      if (!tokenResponse?.access_token) {
        throw new HttpException("Failed to obtain authentication token", 500);
      }

      return tokenResponse.access_token;
    } catch (error) {
      console.error("Error getting access token:", error);
      throw new HttpException("Authentication failed", 500);
    }
  }

  async createOrder(data: CreateOrderType) {
    try {
      const body = JSON.stringify({
        action: "SALE",
        amount: {
          currencyCode: data?.currencyCode,
          value: Number(data?.value),
        },
        emailAddress: data?.emailAddress,
        billingAddress: {
          firstName: data?.firstName,
          lastName: data?.lastName,
        },
        merchantAttributes: {
          redirectUrl: `${process.env.REDIRECT_URL}`,
          skipConfirmationPage: true,
          cancelText: "Go to Cart",
        },
      });
      const response = this.httpService
        .post(process.env.ORDER, body, {
          headers: {
            "Content-Type": "application/vnd.ni-payment.v2+json",
            Authorization: `Bearer ${data?.token}`,
            Accept: "application/vnd.ni-payment.v2+json",
          },
        })
        .pipe(
          map((resp) => resp.data),
          catchError((e) => {
            console.log("err = = = => 2", e);
            throw new HttpException(e.response.data, e.response.status);
          })
        );
      return response;
    } catch (err) {
      console.log("err = = = => 2", err);
      return new DataResponseDto({}, false, "something went wrong.");
    }
  }

  async orderDetails(data: GetOrderDetails) {
    try {
      const response = this.httpService
        .get(process.env.DETAILS + data?.ref, {
          headers: {
            Authorization: `Bearer ${data?.token}`,
          },
        })
        .pipe(
          map((resp) => resp.data),
          catchError((e) => {
            throw new HttpException(e.response.data, e.response.status);
          })
        );
      return response;
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async getOrderDetails(ref: string) {
    if (ref) {
      try {
        const token = await this.createtoken();
        const tokenPromise = lastValueFrom(token);
        const tokenResponse: any = await tokenPromise;
        if (tokenResponse?.access_token) {
          const details: any = await this.orderDetails({
            ref,
            token: tokenResponse?.access_token,
          });
          const detailsPromise = lastValueFrom(details);
          const paymentDetails: any = await detailsPromise;
          return paymentDetails;
        }
        return "gatewayerror";
      } catch (err) {
        return err?.status;
      }
    } else return "noref";
  }

  async createRefund(refundData: CreateRefundDto, token: string) {
    try {
      const refundUrl = `${process.env.API_BASE_URL}/transactions/outlets/${process.env.OUTLET_ID}/orders/${refundData.orderRef}/payments/${refundData.paymentRef}/refund`;

      const body = JSON.stringify({
        amount: {
          currencyCode: refundData.currencyCode,
          value: refundData.amount,
        },
        reason: refundData.reason || "Customer request",
      });

      const response = this.httpService
        .post(refundUrl, body, {
          headers: {
            "Content-Type": "application/vnd.ni-payment.v2+json",
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.ni-payment.v2+json",
          },
        })
        .pipe(
          map((resp) => resp.data),
          catchError((e) => {
            console.log("Refund error:", e.response?.data || e.message);
            throw new HttpException(
              e.response?.data || "Refund request failed",
              e.response?.status || 500
            );
          })
        );

      return response;
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async processRefund(data: CreateRefundDto) {
    try {
      // Generate token on the server for every refund request
      const accessToken = await this.getAccessToken();

      const refundResponse = await this.createRefund(data, accessToken);
      const result = await lastValueFrom(refundResponse);

      return new DataResponseDto(result, true, "Refund processed successfully");
    } catch (err) {
      console.error("Process refund error:", err);
      return new DataResponseDto(
        {},
        false,
        err.response?.data?.message || err.message || "Refund processing failed"
      );
    }
  }
}
