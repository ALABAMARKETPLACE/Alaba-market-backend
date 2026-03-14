import { PaymentTypeEnum } from "./payment-type.enum";

type OrderItemsType = {
  id: number;
  productId: number;
  quantity: number;
  variantId: number | null;
};

type OrderItems = {
  storeId: number;
  products: OrderItemsType[];
};

type paymentType = {
  ref?: string;
  type: PaymentTypeEnum;
  callback_url?: string;
};

type AddressType = {
  readonly id: number;
};

type Charges = {
  token: string;
};
export { OrderItemsType, OrderItems, paymentType, AddressType, Charges };
