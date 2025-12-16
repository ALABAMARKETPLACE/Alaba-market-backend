import { Module } from "@nestjs/common";
import { EnquiryService } from "./enquiry.service";
import { EnquiryProviders } from "./enquiry.provider";
import { EnquiryController } from "./enquiry.controller";
@Module({
  imports: [],
  controllers: [EnquiryController],
  providers: [EnquiryService, ...EnquiryProviders],
  exports: [EnquiryService],
})
export class EnquiryModule {}
