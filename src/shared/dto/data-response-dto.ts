import { ApiProperty } from "@nestjs/swagger";
import { PageOptionsDto } from "./pageOptions.dto";
type statusType = boolean | string | PageOptionsDto | number;
type messageType = string | number | PageOptionsDto;
type dtoType = PageOptionsDto | number | string;
type totalType = number | PageOptionsDto | string;
type tokenType = string | boolean;
type meta = {
  take: number;
  itemCount: number;
  totalPages: number;
  page: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};
export class DataResponseDto {
  @ApiProperty()
  readonly data: any;

  @ApiProperty()
  readonly status: boolean;

  @ApiProperty()
  readonly statusCode: number;

  @ApiProperty()
  readonly message: string;

  readonly meta?: meta;
  readonly token?: string;
  readonly refreshToken?: string;
  readonly newAccount?: boolean;

  constructor(data: any); //only data
  constructor(data: any, status: boolean); //data and status
  constructor(data: any, status: string); //data and message
  constructor(data: any, status: boolean, message: string); //data , status , message
  constructor(data: any, dto: PageOptionsDto, total: number); //data, pageoptions, total
  constructor(data: any, total: number, dto: PageOptionsDto); //data, total, pageoptions
  constructor(data: any, status: boolean, message: string, dto: string); //data, status, message, token
  constructor( //data, status, message, pageoptions, total
    data: any,
    status: boolean,
    message: string,
    dto: PageOptionsDto,
    total: number
  );
  constructor( //data, status, message, total, pageoptions
    data: any,
    status: boolean,
    message: string,
    dto: number,
    total: PageOptionsDto
  );
  constructor( //data, status, message, token, refreshToken
    data: any,
    status: boolean,
    message: string,
    dto: string,
    total: string
  );
  constructor( //data, status, message, token, refreshToken, newAccount
    data: any,
    status: boolean,
    message: string,
    dto: string,
    total: string,
    token: boolean
  );
  constructor(
    data: any,
    status?: statusType,
    message?: messageType,
    dto?: dtoType,
    total?: totalType,
    token?: tokenType,
    refresh?: string,
    newAccount?: boolean
  ) {
    const isTrue = getStatus(status, data);
    this.statusCode = isTrue ? 200 : 400;
    this.status = isTrue ? true : false;
    this.message = getMessage(message, status, isTrue);
    this.data = isTrue ? data : null;
    this.token = getToken(token, dto);
    this.refreshToken = getRefreshToken(refresh, total);
    this.newAccount = getAccountStatus(newAccount, token);
    this.meta = getMeta(isTrue, dto, total, message, status);
    //===============================================================
    function isValid(obj: any) {
      if (typeof obj != "object" || obj == null) return false;
      if ("take" in obj && "page" in obj) return true;
      return false;
    }
    function getMessage(
      message: messageType,
      status: statusType,
      isTrue: boolean
    ) {
      if (typeof message == "string") return message;
      if (typeof status == "string") return status;
      if (isTrue) return "Request Completed Successfully.";
      return "No Data Found.";
    }
    function getStatus(status: statusType, data: any) {
      if (typeof status == "boolean" && status == true) return true;
      if (data != null && status == false) return false;
      if (data != null) return true;
      return false;
    }
    function getToken(token: string | boolean, dto: dtoType) {
      if (typeof token == "string") return token;
      if (typeof dto == "string") return dto;
    }
    function getRefreshToken(refresh: string, total: totalType) {
      if (typeof refresh == "string") return refresh;
      if (typeof total == "string") return total;
    }
    function getAccountStatus(newAccount: boolean, token: tokenType) {
      if (typeof newAccount == "boolean") return newAccount;
      if (typeof token == "boolean") return token;
    }
    function getMeta(
      isTrue: boolean,
      dto: dtoType,
      total: totalType,
      message: messageType,
      status: statusType
    ): meta {
      const types = [
        { value: dto, num: total },
        { value: total, num: dto },
        { value: status, num: message },
        { value: message, num: status },
      ];
      for (const { value, num } of types) {
        if (!(isTrue && isValid(value) && typeof num === "number")) continue;
        const pageOptions = value as PageOptionsDto;
        return {
          take: Number(pageOptions?.take),
          itemCount: num,
          page: Number(pageOptions?.page),
          totalPages: Math.ceil(num / pageOptions?.take),
          hasPreviousPage: pageOptions.page > 1,
          hasNextPage: pageOptions?.page < Math.ceil(num / pageOptions?.take),
        };
      }
    }
  }
}
