import { ApiProperty } from "@nestjs/swagger";
import { Store } from "../store.entity";

export class StoreDto {
  @ApiProperty()
  readonly first_name: string;

  @ApiProperty()
  readonly last_name: string;

  @ApiProperty()
  readonly name: string;

  @ApiProperty()
  readonly email: string;

  @ApiProperty()
  readonly phone: string;

  @ApiProperty()
  readonly code: string;

  @ApiProperty()
  readonly password: string;

  @ApiProperty()
  readonly business_location: string;

  @ApiProperty()
  readonly business_address: string;

  @ApiProperty()
  readonly business_type: string;

  @ApiProperty()
  readonly business_types: JSON;

  @ApiProperty()
  readonly agreement: string;

  @ApiProperty()
  readonly trn_number: string;

  @ApiProperty()
  readonly trade_lisc_no: string;

  @ApiProperty()
  readonly seller_name: string;

  @ApiProperty()
  readonly seller_country: string;

  @ApiProperty()
  readonly birth_country: string;

  @ApiProperty()
  readonly dob: Date;

  @ApiProperty()
  readonly id_proof: string;

  @ApiProperty()
  readonly id_type: string;

  @ApiProperty()
  readonly id_issue_country: string;

  @ApiProperty()
  readonly id_expiry_date: Date;

  @ApiProperty()
  readonly store_name: string;

  @ApiProperty()
  readonly upscs: string;

  @ApiProperty()
  readonly manufacture: string;

  @ApiProperty()
  readonly trn_upload: string;

  @ApiProperty()
  readonly logo_upload: string;

  @ApiProperty()
  readonly id: number;

  @ApiProperty()
  readonly createdAt: Date;

  @ApiProperty()
  readonly status: string;

  @ApiProperty()
  readonly status_remark: string;

  @ApiProperty()
  readonly order_count: number;

  @ApiProperty()
  readonly lat: number;

  @ApiProperty()
  readonly long: number;

  @ApiProperty()
  readonly delivery_period: number;

  @ApiProperty()
  readonly delivery_period_minutes: number;

  @ApiProperty()
  readonly to: string;

  @ApiProperty()
  readonly from: string;

  @ApiProperty()
  readonly auto_approve_refund: boolean;

  @ApiProperty()
  readonly allow_refund: boolean;

  @ApiProperty()
  readonly is_prind_available: boolean;

  @ApiProperty({ required: false, nullable: true })
  readonly account_name_or_code: string | null;

  @ApiProperty({ required: false, nullable: true })
  readonly account_number: string | null;

  @ApiProperty()
  readonly subscription_plan: string;

  @ApiProperty()
  readonly subscription_plan_name: string;

  @ApiProperty()
  readonly subscription_price: number;

  @ApiProperty()
  readonly subscription_boosts: number;

  @ApiProperty()
  readonly description: string;
  readonly cover_image;

  constructor(store: Store) {
    this.name = store.name;
    this.email = store.email;
    this.business_location = store.business_location;
    this.business_type = store.business_type;
    this.agreement = store.agreement;
    this.trn_number = store.trn_number;
    this.trade_lisc_no = store.trade_lisc_no;
    this.seller_name = store.seller_name;
    this.seller_country = store.seller_country;
    this.birth_country = store.birth_country;
    this.dob = store.dob;
    this.id_proof = store.id_proof;
    this.id_issue_country = store.id_issue_country;
    this.id_expiry_date = store.id_expiry_date;
    this.store_name = store.store_name;
    this.upscs = store.upscs;
    this.manufacture = store.manufacture;
    this.trn_upload = store.trn_upload;
    this.logo_upload = store.logo_upload;
    this.phone = store.phone;
    this.id = store.id;
    this.createdAt = store.createdAt;
    this.status = store.status;
    this.status_remark = store.status_remark;
    this.id_type = store.id_type;
    this.first_name = store.first_name;
    this.last_name = store.last_name;
    this.business_address = store.business_address;
    this.code = store.code;
    this.order_count = store.order_count;
    this.lat = store.lat;
    this.long = store.long;
    this.business_types = store.business_types;
    this.delivery_period = store.delivery_period;
    this.delivery_period_minutes = store.delivery_period_minutes;
    this.to = store.to;
    this.from = store.from;
    this.description = store.description;
    this.cover_image = store.cover_image;
    this.auto_approve_refund = store.auto_approve_refund;
    this.allow_refund = store.allow_refund;
    this.is_prind_available = store.is_prind_available;
    this.account_name_or_code = store.account_name_or_code ?? null;
    this.account_number = store.account_number ?? null;
    this.subscription_plan = store.subscription_plan;
    this.subscription_plan_name = store.subscription_plan_name;
    this.subscription_price = store.subscription_price;
    this.subscription_boosts = store.subscription_boosts;
  }
}
