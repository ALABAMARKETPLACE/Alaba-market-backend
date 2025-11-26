import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { PaystackModule } from '../paystack/paystack.module';

@Module({
  imports: [PaystackModule], 
  controllers: [WebhooksController],
  providers: [WebhooksService], 
  exports: [WebhooksService], 
})
export class WebhooksModule {}
