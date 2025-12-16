export const getMetaInfo = (data: any[]) => {
  if (Array.isArray(data) == true) {
    const totalCounts = data.reduce((acc: any, obj) => {
      const id: any = obj.id;
      const count = obj.count;

      if (!acc[id]) {
        acc[id] = 0;
      }

      acc[id] += count;

      return acc;
    }, {});
    const resultArray = Object.keys(totalCounts).map((id) => ({
      id,
      count: totalCounts[id],
    }));
    return resultArray;
  }
  return [];
};
