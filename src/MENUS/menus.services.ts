import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { Menus } from "./menus.entity";
import { CreateMenusDto } from "./dto/create.dto";
import { PageOptionsDto } from "../shared/dto/pageOptions.dto";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { MailService } from "../MAILS/Mails.services";
import { Op } from "sequelize";
import { getErrorMessage } from "../shared/helpers/errormessage";
@Injectable()
export class MenusService {
  constructor(
    @Inject("MenusRepository")
    private menusRepository: typeof Menus,
    private emailService: MailService
  ) {}
}
