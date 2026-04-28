import { Module } from '@nestjs/common';
import { MarketplaceFeedController } from './marketplace-feed.controller';
import { MarketplaceFeedService } from './marketplace-feed.service';
import { Products } from '../PRODUCTS/products.entity';
import { Store } from '../STORE/store.entity';

const MarketplaceFeedProviders = [
  { provide: 'MarketplaceProductsRepository', useValue: Products },
  { provide: 'MarketplaceStoreRepository', useValue: Store },
];

@Module({
  controllers: [MarketplaceFeedController],
  providers: [...MarketplaceFeedProviders, MarketplaceFeedService],
})
export class MarketplaceFeedModule {}
