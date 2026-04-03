import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { SharedModule } from "./shared/shared.module";

import { UserModule } from "./USERS/user.module";
import { AuthModule } from "./USER_AUTH/auth.module";
import { LandingModule } from "./LANDING/landing.module";
import { SubCategoryModule } from "./SUB_CATEGORY/sub_category.module";
import { ProductsModule } from "./PRODUCTS/products.module";
import { BannerModule } from "./BANNER/banner.module";
import { CategoryModule } from "./CATEGORY/category.module";
import { ProductReviewsModule } from "./PRODUCT_REVIEWS/prod_rev.module";
import { AddressModule } from "./ADDRESS/address.module";
import { WishlistsModule } from "./WISHLIST/wishlist.module";
import { ProductSearchModule } from "./PRODUCT_SEARCH/product_search.module";
import { CartModule } from "./CART/cart.module";
import { MenusModule } from "./MENUS/menus.module";
import { OffersModule } from "./OFFERS/offers.module";
import { SettingsModule } from "./SETTINGS/settings.module";
import { ImgcompressModule } from "./IMAGE_COMPRESS/img_compress.module";
import { StoreModule } from "./STORE/store.module";
import { IndividualSellerModule } from "./INDIVIDUAL_SELLER/individualseller.module";
import { BusinessTypeModule } from "./BUSINESS_TYPE/businesstype.module";
import { OrderModule } from "./ORDER/order.module";
import { ProductImageModule } from "./PRODUCT_IMAGE/productimage.module";
import { ProductVariantModule } from "./PRODUCT_VARIANTS/productvariant.module";
import { StatesModule } from "./STATES/states.module";
import { EnquiryModule } from "./ENQUIRIES/enquiry.module";
import { DeliveryChargeModule } from "./DELIVERY_CHARGE/deliverycharge.module";
import { WeightChargeModule } from "./WEIGHT_CHARGE/weightcharge.module";
import { DistanceChargeModule } from "./DISTANCE_CHARGE/distancecharge.module";
import { LbhChargeModule } from "./LBH_CHARGE/lbhcharge.module";
import { StoreSearchModule } from "./STORE_SEARCH/store_search.module";
import { OrderItemsModule } from "./ORDER_ITEMS/order_items.module";
import { OrderPaymentsModule } from "./ORDER_PAYMENTS/order_payments.module";
import { OrderStatusModule } from "./ORDER_STATUS/order_status.module";
import { GoogleProxyModule } from "./google-proxy/google-proxy.module";
import { InvoiceItemsModule } from "./INVOICE_ITEMS/invoiceitems.module";
import { InvoiceModule } from "./INVOICE/invoice.module";
import { PaymentGatewayModule } from "./PAYMENT_GATEWAY/payment_gateway.module";
import { CalculateDeliveryChargeModule } from "./CALCULATE_DELIVERY_CHARGE/calculate_delivery.module";
import { SettlementsModule } from "./SETTLEMENTS/settlements.module";
import { UserHistoryModule } from "./USER_HISTORY/userhistory.module";
// import { NewsAndBlogsModule } from "./NEWS_BLOGS/newsandblogs.module";
import { StoreReviewModule } from "./STORE_REVIEW/storereview.module";
import { CacheModule } from "@nestjs/cache-manager";
import { OrderLogModule } from "./ORDER_LOG/orderlog.module";
import { PaymentLogModule } from "./PAYMENT_LOG/paymentlog.module";
import { TokenManagementModule } from "./TOKEN_MANAGEMENT/module";
import { NotificationsModule } from "./NOTIFICATIONS/notifications.module";
import { FirebaseModule } from "./FIREBASE/firebase.module";
import { DatabaseModule } from "./database/database.module";
import { NestJwtModule } from "./JWT_MODULE/jwt.module";
import { SubstitutionModule } from "./ORDER_SUBSTITUTION/substitution.module";
import { DashboardModule } from "./DASHBOARD/dashboard.module";
import { UserBankAccountModule } from "./USER_BANK_ACCOUNTS/user_bank_accounts.module";
import { RefundRequestModule } from "./REFUND_REQUEST/refund-request.module";
import { TokenGatewayModule } from "./SUBSTITUTION_SOKET/token.module";
import { PrintConfigerationModule } from "./PRINT_CONFIGERATION/print_configeration.module";
import { PrintModule } from "./PRINT/print.module";
import { PrintItemsModule } from "./PRINT_ITEMS/print_items.module";
import { PrintStatusModule } from "./PRINT_STATUS/print_status.module";
import { PaystackModule } from "./PAYSTACK_PAYMENT/paystack.module";
import { PaystackSubaccountModule } from "./PAYSTACK_SUBACCOUNTS/paystack-subaccount.module";
import { CountriesModule } from "./COUNTRIES/countries.module";
import { NewDistanceChargeModule } from "./NEW_DISTANCE_CHARGE/newdistancecharge.module";
import { NewAddressModule } from "./NEW_ADDRESS/newaddress.module";
import { SubscriptionPlanModule } from "./SUBSCRIPTION_PLANS/subscription-plan.module";
import { BoostRequestModule } from "./BOOST_REQUESTS/boost-request.module";
import { FeaturedProductsModule } from "./FEATURED_PRODUCTS/featured-products.module";
import { DeliveryCompanyModule } from "./DELIVERY_COMPANY/delivery_company.module";
import { NewsAndBlogsModule } from "./NEWS_AND_BLOGS/newsandblogs.module";


@Module({
  imports: [
    DatabaseModule,
    ScheduleModule.forRoot(),
    FirebaseModule,
    NestJwtModule,
    CacheModule.register({
      isGlobal: true,
      ttl: 172800000,
      max: 200,
    }),
    SharedModule,
    AuthModule,
    UserModule,
    LandingModule,
    BannerModule,
    CategoryModule,
    SubCategoryModule,
    ProductsModule,
    ProductReviewsModule,
    AddressModule,
    WishlistsModule,
    ProductSearchModule,
    CartModule,
    MenusModule,
    OffersModule,
    // NewsAndBlogsModule,
    SettingsModule,
    StoreModule,
    ImgcompressModule,
    IndividualSellerModule,
    BusinessTypeModule,
    OrderModule,
    ProductImageModule,
    ProductVariantModule,
    StatesModule,
    EnquiryModule,
    DeliveryChargeModule,
    WeightChargeModule,
    DistanceChargeModule,
    LbhChargeModule,
    StoreSearchModule,
    OrderItemsModule,
    OrderPaymentsModule,
    OrderStatusModule,
    GoogleProxyModule,
    InvoiceItemsModule,
    InvoiceModule,
    PaymentGatewayModule,
    CalculateDeliveryChargeModule,
    SettlementsModule,
    UserHistoryModule,
    NewsAndBlogsModule,
    StoreReviewModule,
    OrderLogModule,
    PaymentLogModule,
    TokenManagementModule,
    NotificationsModule,
    SubstitutionModule,
    DashboardModule,
    UserBankAccountModule,
    RefundRequestModule,
    TokenGatewayModule,
    PrintConfigerationModule,
    PrintModule,
    PrintItemsModule,
    PrintStatusModule,
    PaystackModule,
    PaystackSubaccountModule,
    CountriesModule,
    NewDistanceChargeModule,
    NewAddressModule,
    SubscriptionPlanModule,
    BoostRequestModule,
    FeaturedProductsModule,
    DeliveryCompanyModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
