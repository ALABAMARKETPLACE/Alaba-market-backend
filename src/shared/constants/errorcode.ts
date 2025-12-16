export const ErrorCodes = {
  foreignKey: "ER3004", //error occured due to foreign key relation between tables
  s3upload: "ER1001", //failed to upload to s3
  orderPayments: "ERRORDP1", //some failure in order payements module(create order payment)
  orderItems: "ERRORDI1", //error occured in order items module (create)
  orderStatus:"ERRORDS1", //error occured in order status (create)
} as const;

//import { ErrorCodes } from "../shared/constants/errorcode";
