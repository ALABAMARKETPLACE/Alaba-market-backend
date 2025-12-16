import { CartItem, gropedProducts } from "../../ORDER/dto/createOrder.dto";
//this function will group the products based on storeId
export const groupProductsByStore = (
  data: CartItem[]
): gropedProducts[] | [] => {
  if (Array.isArray(data) && data.length) {
    const groupedData = data.reduce((acc, item: CartItem) => {
      const storeId = item.storeId;
      const existingStore = acc.find((store: any) => store.storeId === storeId);

      if (existingStore) {
        existingStore.products.push({
          ...item,
        });
      } else {
        acc.push({
          storeId: storeId,
          products: [
            {
              ...item,
            },
          ],
        });
      }

      return acc;
    }, []);
    return groupedData;
  }
  return [];
};
