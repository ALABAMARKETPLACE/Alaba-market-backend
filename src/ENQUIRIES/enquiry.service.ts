import {
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { Enquiry } from "./enquiry.entity";
import { CreateEnquiryDto } from "./dto/create.dto";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { getErrorMessage } from "../shared/helpers/errormessage";
import { PageOptionsDto } from "../shared/dto/pageOptions.dto";
import { EnquirySearchDto } from "./dto/querySearch.dto";
import { Op } from "sequelize";
import { MailService } from "../MAILS/Mails.services";
const EnquiryNotification = require("../MAILS/templates/auth/enquiryNotification");
const EnquirySenderNotification = require("../MAILS/templates/auth/enquirySenderNotification");

const DEFAULT_ENQUIRY_RECIPIENTS = [
  "Customerservice@alabamarketplace.ng",
  "alabamarketplace2025@gmail.com",
  "emeka@taxgoglobal.com",
  "alaba@taxgoglobal.com",
  "olagiddz@gmail.com",
];

const parseRecipients = (value?: string) =>
  (value || "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);

@Injectable()
export class EnquiryService {
  constructor(
    @Inject("EnquiryRepository")
    private readonly EnquiryRepository: typeof Enquiry,
    private readonly mailService: MailService,
  ) {}

  async findAll(querys: EnquirySearchDto) {
    const { offset, query, limit } = querys;
    try {
      const { rows, count } = await this.EnquiryRepository.findAndCountAll({
        limit,
        offset,
        order: [["createdAt", "DESC"]],
        where: {
          ...(query && {
            email: {
              [Op.like]: `%${query}%`,
            },
          }),
        },
      });
      return new DataResponseDto(rows, true, "Success", querys, count);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async create(create: CreateEnquiryDto) {
    try {
      const enquiry = new Enquiry();
      enquiry.email = create.email?.toLowerCase();
      enquiry.message = create.message;
      const createData = await enquiry.save();

      const recipients =
        parseRecipients(process.env.ENQUIRY_NOTIFY_EMAILS).length > 0
          ? parseRecipients(process.env.ENQUIRY_NOTIFY_EMAILS)
          : DEFAULT_ENQUIRY_RECIPIENTS;

      const mail = EnquiryNotification({
        to: recipients,
        email: enquiry.email,
        message: enquiry.message,
      });

      const senderMail = EnquirySenderNotification({
        to: enquiry.email,
        email: enquiry.email,
        message: enquiry.message,
      });

      await this.mailService.queueEnquiryNotification(mail);
      await this.mailService.queueEnquiryNotification(senderMail);

      return new DataResponseDto(createData, true, "Successfully added");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async delete(id: number) {
    try {
      const deleted = await this.EnquiryRepository.destroy({ where: { id } });
      if (deleted == 0) throw new NotFoundException();
      return new DataResponseDto(deleted);
    } catch (err) {
      throw new InternalServerErrorException();
    }
  }

  async update(id: number, body: CreateEnquiryDto) {
    try {
      const [updated, [data]] = await this.EnquiryRepository.update(body, {
        where: { id },
        returning: true,
      });
      if (updated == 0) throw new NotFoundException();
      return new DataResponseDto(data);
    } catch (err) {
      throw new InternalServerErrorException();
    }
  }

  async patch(id: number, body: CreateEnquiryDto) {
    try {
      const [updated, [data]] = await this.EnquiryRepository.update(
        {
          message: body.message,
        },
        {
          where: { id },
          returning: true,
        },
      );
      if (updated == 0) throw new NotFoundException();
      return new DataResponseDto(data);
    } catch (err) {
      throw new InternalServerErrorException();
    }
  }
}
