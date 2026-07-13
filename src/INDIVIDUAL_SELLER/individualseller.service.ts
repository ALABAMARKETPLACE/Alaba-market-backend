import { createStructuredLogger } from "../shared/logger/structured-logger";
import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { IndividualSeller } from "./individualseller.entity";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { CreateIndividualSellerDto } from "./dto/createIndividualSeller.dto";
import { IndividualSellerDto } from "./dto/individualseller.dto";
import { PageOptionsDto } from "../shared/dto/pageOptions.dto";
import { UpdateStoreStatusDto } from "./dto/updateStatus.dto";
import { MailService } from "../MAILS/Mails.services";
import { RequestDocumentMailDto } from "../STORE/dto/requestDocumentMail.dto";
import { ToAdminIndividual } from "../MAILS/templates/sellers/toAdmin_individual";
import { ToUserIndividual } from "../MAILS/templates/sellers/toUser_individual";
import { SettingsService } from "../SETTINGS/settings.service";
import { ToUserApproval } from "../MAILS/templates/sellers/toUser_Approval";
import { ToUserRejection } from "../MAILS/templates/sellers/toUser_Rejection";
import { ToIndividualRequestDocument } from "../MAILS/templates/sellers/toIndivRequestDocument";
import { getErrorMessage } from "../shared/helpers/errormessage";
import { QuerySellerDto } from "./dto/querySeller.dto";
import { NotificationsService } from "../NOTIFICATIONS/notification.service";
import { Op } from "sequelize";

const appLog = createStructuredLogger("individualseller_service");

@Injectable()
export class IndividualSellerService {
  constructor(
    @Inject("IndividualSellerRepository")
    private readonly IndividualSellerRepository: typeof IndividualSeller,
    private readonly mailService: MailService,
    private settingsService: SettingsService,
    private readonly notificationsService: NotificationsService
  ) {}
  async findWithPagination(pageOptionsDto: QuerySellerDto) {
    try {
      const { query } = pageOptionsDto;
      const { rows, count } =
        await this.IndividualSellerRepository.findAndCountAll({
          order: [["createdAt", pageOptionsDto.order]],
          limit: pageOptionsDto.take,
          offset: pageOptionsDto.offset,
          where: {
            status: { [Op.ne]: "approved" },
            ...(query && {
              [Op.or]: [
                { name: { [Op.iLike]: `%${query}%` } },
                { email: query },
                { phone: query },
              ],
            }),
          },
        });
      const data = rows.map(
        (item: IndividualSeller) => new IndividualSellerDto(item)
      );
      return new DataResponseDto(data, true, "Success", pageOptionsDto, count);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async findOne(id: number) {
    try {
      const individualseller = await this.IndividualSellerRepository.findByPk(
        id
      );
      if (!individualseller)
        throw new HttpException("No ID found", HttpStatus.NOT_FOUND);
      return new DataResponseDto(
        individualseller,
        true,
        "Successfully fetched"
      );
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async create(data: CreateIndividualSellerDto) {
    try {
      const individualseller = new IndividualSeller();
      individualseller.name = data.name;
      individualseller.email = data.email;
      individualseller.business_location = data.business_location;
      individualseller.education = data.education;
      individualseller.visa_status = data.visa_status;
      individualseller.age = data.age;
      individualseller.gender = data.gender;
      individualseller.language = data.language;
      individualseller.interest = data.interest;
      individualseller.phone = data.phone;
      individualseller.code = data.code;
      individualseller.status = "pending";
      individualseller.status_remark = "";
      const created = await individualseller.save();
      let adminEmail = await this.settingsService.getAdminEmail();
      let adminMail = await ToAdminIndividual(created, adminEmail);
      let userMail = await ToUserIndividual(created);
      this.mailService.sellerEmails(adminMail);
      this.mailService.sellerEmails(userMail);
      return new DataResponseDto(created, true, "Successfully Created");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async updateStatus(id: number, data: UpdateStoreStatusDto) {
    try {
      const individualseller = await IndividualSeller.findByPk(id);
      if (!individualseller)
        throw new HttpException("No ID found", HttpStatus.NOT_FOUND);
      individualseller.status = data.status;
      individualseller.status_remark = data.status_remark;
      const updated = await individualseller.save();
      let approvalMail = await ToUserApproval(updated);
      let rejectionMail = await ToUserRejection(updated);
      if (data.status === "approved") {
        this.mailService.sellerEmails(approvalMail);
        // Send simple approval notification (individual flow has no plan)
        try {
          appLog.info(
            "[IndividualSellerService.updateStatus] Creating approval notification",
            {
              sellerId: updated?.id,
            }
          );
          const notif = await this.notificationsService.createNotification(
            "seller_approval",
            "You're approved! You can now start selling.",
            "Seller Account Approved",
            updated?.id,
            (updated as any)?.userId || (updated as any)?.id
          );
          appLog.info(
            "[IndividualSellerService.updateStatus] Notification created",
            {
              notificationId: (notif as any)?.id,
            }
          );
        } catch (e) {
          appLog.error(
            "[IndividualSellerService.updateStatus] Notification error",
            e
          );
        }
      } else if (data.status === "rejected") {
        this.mailService.sellerEmails(rejectionMail);
      }
      return new DataResponseDto(updated, true, "Successfully Updated");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async delete(id: number) {
    try {
      const individualseller = await IndividualSeller.findByPk(id);
      if (!individualseller)
        throw new HttpException("No ID found", HttpStatus.NOT_FOUND);
      await individualseller.destroy();
      return new DataResponseDto(
        individualseller,
        true,
        "Successfully Deleted"
      );
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }
  async reqestDocumentMail(data: RequestDocumentMailDto) {
    try {
      let documentmail = await ToIndividualRequestDocument(data);
      const mail = await this.mailService.RequestDocumentMail(documentmail);
      return new DataResponseDto({}, true, "Email send successfully");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }
}
