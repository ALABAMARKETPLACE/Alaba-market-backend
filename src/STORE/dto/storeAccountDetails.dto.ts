import { ApiProperty } from "@nestjs/swagger";
import { Store } from "../store.entity";

export class StoreAccountDetailsDto {
  @ApiProperty()
  readonly id: number;

  @ApiProperty({ required: false, nullable: true })
  readonly account_name_or_code: string | null;

  @ApiProperty({ required: false, nullable: true })
  readonly account_number: string | null;

  @ApiProperty()
  readonly store_name: string;

  constructor(store: Store) {
    this.id = store.id;
    this.account_name_or_code = store.account_name_or_code ?? null;
    this.account_number = store.account_number ?? null;
    this.store_name = store.store_name;
  }
}

