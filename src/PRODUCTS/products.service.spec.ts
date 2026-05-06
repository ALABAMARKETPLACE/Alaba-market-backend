import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Op } from "sequelize";
import { ProductsService } from "./products.services";

describe("ProductsService public listing", () => {
  let repository: { findAndCountAll: any };
  let service: ProductsService;

  beforeEach(() => {
    repository = {
      findAndCountAll: jest.fn(),
    };

    service = new ProductsService(
      repository as any,
      {} as any,
      {} as any,
      {} as any,
      ((value: string) => value) as any
    );
  });

  it("returns page 1 with pagination metadata", async () => {
    repository.findAndCountAll.mockResolvedValue({
      rows: [{ _id: 1 }, { _id: 2 }],
      count: 5,
    });

    const result = await service.findPublicProducts({ page: 1, take: 2 } as any);

    expect(result.data).toEqual([{ _id: 1 }, { _id: 2 }]);
    expect(result.meta).toEqual(
      expect.objectContaining({
        page: 1,
        take: 2,
        itemCount: 5,
        totalPages: 3,
        hasNextPage: true,
      })
    );
    expect(repository.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 2,
        offset: 0,
        distinct: true,
      })
    );
  });

  it("uses the correct offset for page 2", async () => {
    repository.findAndCountAll.mockResolvedValue({
      rows: [{ _id: 3 }, { _id: 4 }],
      count: 5,
    });

    await service.findPublicProducts({ page: 2, take: 2 } as any);

    expect(repository.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 2,
        offset: 2,
      })
    );
  });

  it("sets hasNextPage false on the last page", async () => {
    repository.findAndCountAll.mockResolvedValue({
      rows: [{ _id: 5 }],
      count: 5,
    });

    const result = await service.findPublicProducts({ page: 3, take: 2 } as any);

    expect(result.meta).toEqual(
      expect.objectContaining({
        page: 3,
        take: 2,
        itemCount: 5,
        totalPages: 3,
        hasNextPage: false,
      })
    );
  });

  it("preserves filters while paginating", async () => {
    repository.findAndCountAll.mockResolvedValue({
      rows: [],
      count: 0,
    });

    await service.findPublicProducts({
      page: 2,
      take: 20,
      search: "phone",
      categoryId: 12,
      subCategoryId: 25,
      storeId: 1585,
      brandId: "Oraimo",
      minPrice: 1000,
      maxPrice: 50000,
    } as any);

    expect(repository.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 20,
        offset: 20,
        where: expect.objectContaining({
          status: true,
          category: 12,
          subCategory: 25,
          store_id: 1585,
          brand: "Oraimo",
          [Op.or]: expect.any(Array),
          retail_rate: expect.objectContaining({
            [Op.gte]: 1000,
            [Op.lte]: 50000,
          }),
        }),
      })
    );
  });
});
