import { Op, Sequelize, where } from "sequelize";
import { Category } from "../CATEGORY/category.entity";
import { SubCategory } from "../SUB_CATEGORY/sub_category.entity";
import { ProductImage } from "../PRODUCT_IMAGE/productimage.entity";
import { ProductVariant } from "../PRODUCT_VARIANTS/productvariant.entity";
import { Store } from "../STORE/store.entity";
import { CartTable } from "../CART/cart.entity";
import { Wishlist } from "../WISHLIST/wishlist.entity";
import { ProductReviews } from "../PRODUCT_REVIEWS/prod_rev.entity";
import { Order } from "../shared/constants/constants";

export class ProductAttributes {
  productAttributes = [
    "_id",
    "name",
    "image",
    "category",
    "description",
    "retail_rate",
    "status",
    "subCategory",
    "title",
    "unit",
    "store_id",
    "price",
    "pid",
    "slug",
    "createdAt",
    "averageRating",
    "totalReviews",
    "is_boosted",
    "boost_score",
    "boosted_until",
  ];
  pVariantAttributes = [
    "image",
    "available",
    "barcode",
    "combination",
    "price",
    "sku",
    "id",
    "units",
  ];
  storeAttributes: any[] = [
    "store_name",
    "business_types",
    "id",
    "logo_upload",
    "createdAt",
    "slug",
    "order_count",
    "cover_image",
    "ratings",
    "averageRating",
    "delivery_period_minutes"
  ];
  fetchOneExcludeAttributes = [
    "purchase_rate",
    "orderCount",
    "createdAt",
    "updatedAt",
    "items",
    "units",
  ];
  subCategoryAttributes = [
    "_id",
    "name",
    "description",
    "image",
    "slug",
    "category_id",
  ];
  autoCompleteAttributes = ["name", "image", "retail_rate", "pid"];
  pImageAttributes = ["url", "type"];
  modalsToInclude = [
    {
      model: Category,
      required: true,
      attributes: ["name"],
    },
    {
      model: SubCategory,
      required: true,
      attributes: ["name"],
    },
    {
      model: ProductImage,
      required: false,
      attributes: this.pImageAttributes,
    },
    {
      model: ProductVariant,
      required: false,
      attributes: this.pVariantAttributes,
    },
    {
      model: Store,
      required: true,
      attributes: ["store_name"],
      where: { status: "approved" },
    },
  ];
  productAttributeUser: any[] = [
    [
      Sequelize.literal(
        'CASE WHEN "cartDetail"."id" IS NOT NULL THEN TRUE ELSE FALSE END'
      ),
      "cart",
    ],
    [
      Sequelize.literal(
        'CASE WHEN "wishLists"."id" IS NOT NULL THEN TRUE ELSE FALSE END'
      ),
      "wishlist",
    ],
    [
      Sequelize.literal(
        'CASE WHEN "productReview"."_id" IS NOT NULL THEN TRUE ELSE FALSE END'
      ),
      "review",
    ],
  ];
  loggedUserModels(userId: number) {
    return [
      {
        model: CartTable,
        as: "cartDetail",
        required: false,
        where: { userId },
        attributes: ["variantId"],
      },
      {
        model: Wishlist,
        as: "wishLists",
        required: false,
        where: { userId },
        attributes: [],
      },
      {
        model: ProductReviews,
        as: "productReview",
        required: false,
        where: { user_id: userId },
        attributes: [],
      },
    ];
  }

  storeIncludeDistance(lattitude: number, longitude: number) {
    return [
      [
        Sequelize.literal(
          `HaversineDistance(${lattitude}, ${longitude}, lat, long)`
        ),
        "distance",
      ],
    ];
  }
  async getDefaultStoreId(
    lattitude: number,
    longitude: number,
    radius: number
  ) {
    try {
      //to check if any stores are available in user's location
      const stores = await Store.findAll({
        where: {
          [Op.and]: [
            Sequelize.literal(`HaversineDistance(?, ?, lat, long) <= ?`),
          ],
        },
        replacements: [lattitude, longitude, radius],
        attributes: ["id"],
      });
      if (stores.length > 0) {
        //means some store found
        return null;
      }
      //if not stores are available we'll initiate search in nextme store
      const nextmestore = await Store.findOne({
        where: { default: true },
        attributes: ["id"],
      });
      if (!nextmestore) return null;
      // whereCondition = { id: nextmestore.id };
      return nextmestore?.id;
    } catch (err) {
      throw err;
    }
  }
  productOrder(
    order: Order = null,
    price: string = null,
    tag: string = null
  ): any[] {
    const activeBoostScore = Sequelize.literal(
      `CASE
        WHEN "is_boosted" = TRUE AND "boosted_until" > NOW()
        THEN COALESCE("boost_score", 0)
        ELSE 0
      END`
    );
    const boostOrder = [[activeBoostScore as any, "DESC"]];

    if (tag == "top") {
      return [...boostOrder, ["averageRating", "DESC"], ["createdAt", "DESC"]];
    } else if (tag == "recent" || order == "DESC") {
      return [...boostOrder, ["createdAt", "DESC"]];
    } else if (price == "ASC" || price == "DESC") {
      return [...boostOrder, ["retail_rate", price], ["createdAt", "DESC"]];
    } else {
      return [...boostOrder, ["createdAt", "DESC"]];
    }
  }

  // Returns ORDER BY fragments to push boosted products first
  // Assumes Postgres. productAlias must match quoted table alias in queries (default "Products").
  boostOrder(productAlias: string = '"Products"') {
    const boostedFlag = Sequelize.literal(
      `CASE WHEN EXISTS (
        SELECT 1
        FROM "BOOST_REQUESTS" br,
             jsonb_array_elements_text(br.product_ids)::bigint pid
        WHERE br.status = 'approved'
          AND br.start_date <= NOW()
          AND br.end_date   >= NOW()
          AND pid = ${productAlias}._id
      ) THEN 0 ELSE 1 END`
    );
    const boostPriority = Sequelize.literal(
      `(SELECT MIN(br.boost_priority)
        FROM "BOOST_REQUESTS" br,
             jsonb_array_elements_text(br.product_ids)::bigint pid
        WHERE br.status = 'approved'
          AND br.start_date <= NOW()
          AND br.end_date   >= NOW()
          AND pid = ${productAlias}._id)`
    );
    const boostApprovedAt = Sequelize.literal(
      `(SELECT MIN(br.approved_at)
        FROM "BOOST_REQUESTS" br,
             jsonb_array_elements_text(br.product_ids)::bigint pid
        WHERE br.status = 'approved'
          AND br.start_date <= NOW()
          AND br.end_date   >= NOW()
          AND pid = ${productAlias}._id)`
    );
    // Order array: boosted first, then by priority asc, then by approved_at asc
    return [
      [boostedFlag as any, 'ASC'],
      [boostPriority as any, 'ASC NULLS LAST'],
      [boostApprovedAt as any, 'ASC NULLS LAST'],
    ];
  }
}
