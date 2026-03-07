import { Process, Processor } from "@nestjs/bull";
import { Injectable, Logger } from "@nestjs/common";
import { Job } from "bull";
import {
  ENQUIRY_MAIL_JOB,
  ENQUIRY_MAIL_QUEUE,
  EnquiryMailJobData,
} from "./mail-queue.constants";
import { MailService } from "./Mails.services";

@Injectable()
@Processor(ENQUIRY_MAIL_QUEUE)
export class EnquiryMailProcessor {
  private readonly logger = new Logger(EnquiryMailProcessor.name);

  constructor(private readonly mailService: MailService) {}

  @Process({ name: ENQUIRY_MAIL_JOB, concurrency: 5 })
  async handleEnquiryMail(job: Job<EnquiryMailJobData>) {
    this.logger.log(`Processing enquiry mail job ${job.id} for ${job.data.to}`);
    await this.mailService.deliverEnquiryNotification(job.data);
  }
}
