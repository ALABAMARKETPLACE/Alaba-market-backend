import { Sequelize } from "sequelize-typescript";
import { User } from "./../USERS/user.entity";
import { ConfigService } from "./../shared/config/config.service";
import { SubCategory } from "../SUB_CATEGORY/sub_category.entity";
import { Products } from "../PRODUCTS/products.entity";
import { Banner } from "../BANNER/banner.entity";
import { Category } from "../CATEGORY/category.entity";
import { ProductReviews } from "../PRODUCT_REVIEWS/prod_rev.entity";
import { Address } from "../ADDRESS/address.entity";
import { Wishlist } from "../WISHLIST/wishlist.entity";
import { CartTable } from "../CART/cart.entity";
import { Menus } from "../MENUS/menus.entity";
import { Offers } from "../OFFERS/offers.entity";
import { Settings } from "../SETTINGS/settings.entity";
import { Store } from "../STORE/store.entity";
import { IndividualSeller } from "../INDIVIDUAL_SELLER/individualseller.entity";
import { BusinessType } from "../BUSINESS_TYPE/businesstype.entity";
import { Order } from "../ORDER/order.entity";
import { ProductImage } from "../PRODUCT_IMAGE/productimage.entity";
import { ProductVariant } from "../PRODUCT_VARIANTS/productvariant.entity";
import { States } from "../STATES/states.entity";
import { Enquiry } from "../ENQUIRIES/enquiry.entity";
import { DeliveryCharge } from "../DELIVERY_CHARGE/deliverycharge.entity";
import { WeightCharge } from "../WEIGHT_CHARGE/weightcharge.entity";
import { DistanceCharge } from "../DISTANCE_CHARGE/distancecharge.entity";
import { LbhCharge } from "../LBH_CHARGE/lbhcharge.entity";
import { OrderItems } from "../ORDER_ITEMS/order_items.entity";
import { OrderPayments } from "../ORDER_PAYMENTS/order_payments.entity";
import { OrderStatus } from "../ORDER_STATUS/order_status.entity";
import { InvoiceItems } from "../INVOICE_ITEMS/invoiceitems.entity";
import { Invoice } from "../INVOICE/invoice.entity";
import { Settlements } from "../SETTLEMENTS/settlements.entity";
import { UserHistory } from "../USER_HISTORY/userhistory.entity";
import { NewsAndBlogs } from "../NEWS_BLOGS/newsandblogs.entity";
import { StoreReview } from "../STORE_REVIEW/storereview.entity";
import { OrderLog } from "../ORDER_LOG/orderlog.entity";
import { PaymentLog } from "../PAYMENT_LOG/paymentlog.entity";
import { TokenManagement } from "../TOKEN_MANAGEMENT/entity";
import { NotificationsModal } from "../NOTIFICATIONS/notification.entity";
import { OrderSubstitution } from "../ORDER_SUBSTITUTION/substitution.entity";
import { SubstituteProducts } from "../ORDER_SUBSTITUTION/substitute.products.entity";
import { OfferProducts } from "../OFFER_PRODUCTS/offer_products.entity";
import { UserBankAccount } from "../USER_BANK_ACCOUNTS/user_bank_accounts.entity";
import { RefundRequest } from "../REFUND_REQUEST/refund-request.entity";
import { PrintConfigeration } from "../PRINT_CONFIGERATION/print_configeration.entity";
import { Print } from "../PRINT/print.entity";
import { PrintItems } from "../PRINT_ITEMS/print_items.entity";
import { PrintStatus } from "../PRINT_STATUS/print_status.entity";
import { Countries } from "../COUNTRIES/countries.entity";
import { NewDistanceCharge } from "../NEW_DISTANCE_CHARGE/newdistancecharge.entity";
import { NewAddress } from "../NEW_ADDRESS/newaddress.entity";
import { SubscriptionPlan } from "../SUBSCRIPTION_PLANS/subscription-plan.entity";
import { BoostRequest } from "../BOOST_REQUESTS/boost-request.entity";
import { FeaturedRotationState } from "../FEATURED_PRODUCTS/featured-rotation-state.entity";
import { DeliveryCompany } from "../DELIVERY_COMPANY/delivery_company.entity";
import { Driver } from "../DELIVERY_COMPANY/driver.entity";
import { DriverInvitation } from "../DELIVERY_COMPANY/driver_invitation.entity";
import { DriverOrder } from "../DELIVERY_COMPANY/driver_order.entity";
export const databaseProviders = [
  {
    provide: "SEQUELIZE",
    useFactory: async (configService: ConfigService) => {
      const sequelize = new Sequelize(configService.sequelizeOrmConfig);
      sequelize.addModels([
        User,
        Banner,
        Category,
        SubCategory,
        Products,
        ProductReviews,
        Address,
        Wishlist,
        CartTable,
        Menus,
        Offers,
        Settings,
        Store,
        IndividualSeller,
        BusinessType,
        Order,
        ProductImage,
        ProductVariant,
        States,
        Enquiry,
        DeliveryCharge,
        WeightCharge,
        DistanceCharge,
        LbhCharge,
        OrderItems,
        OrderPayments,
        OrderStatus,
        InvoiceItems,
        Invoice,
        Settlements,
        UserHistory,
        NewsAndBlogs,
        StoreReview,
        OrderLog,
        PaymentLog,
        TokenManagement,
        NotificationsModal,
        OrderSubstitution,
        SubstituteProducts,
        OfferProducts,
        UserBankAccount,
        RefundRequest,
        PrintConfigeration,
        Print,
        PrintItems,
        PrintStatus,
        Countries,
        NewDistanceCharge,
        NewAddress,
        SubscriptionPlan,
        BoostRequest,
        FeaturedRotationState,
        DeliveryCompany,
        Driver,
        DriverInvitation,
        DriverOrder,
      ]);
      // WARNING: force: true will drop all tables and recreate them!
      // Only use in development. Comment out after first run.
      // await sequelize.sync({ force: true });

      // Use alter: true to update existing tables (safer)
      await sequelize.sync({ alter: true });
      return sequelize;
    },
    inject: [ConfigService],
  },
];
