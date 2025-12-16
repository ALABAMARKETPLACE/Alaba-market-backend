export const calculateTotalPrice = (data: any[]) => {
  if (Array.isArray(data) == true && data.length) {
    const calculated = [];
    for (const item of data) {
      let totalprice = 0;
      for (const product of item?.products) {
        totalprice += product.totalPrice;
      }
      calculated.push({
        ...item,
        totalprice,
        totalItems: item?.products.length,
        grandTotal: totalprice,
      });
    }
    return calculated;
  }
  return [];
};
