type PrintItemsType = {
  quantity: number;
  image:string;
  price:number;
  orientation:string;
  printConfigerationId:number;
  name:string;
  number_of_pages:number
};

type PrintItems = {
  storeId: number;
  products: PrintItemsType[];
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
export { PrintItemsType, PrintItems, paymentType, AddressType, Charges };
