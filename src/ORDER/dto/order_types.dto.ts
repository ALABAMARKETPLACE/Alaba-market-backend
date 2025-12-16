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
  ref: string;
  type: string;
};

type AddressType = {
  readonly id: number;
};

type Charges = {
  token: string;
};
export { OrderItemsType, OrderItems, paymentType, AddressType, Charges };
