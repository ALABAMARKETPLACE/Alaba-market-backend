import { Module } from '@nestjs/common';
import { GoogleProxyController } from './google-proxy.controller';
import { GoogleProxyService } from './google-proxy.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports:[HttpModule],
  controllers: [GoogleProxyController],
  providers: [GoogleProxyService]
})
export class GoogleProxyModule {}
