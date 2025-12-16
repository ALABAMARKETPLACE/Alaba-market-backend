import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { RolesConfig } from "./rolesConfig.entity";
import { PageOptionsDto } from "../shared/dto/pageOptions.dto";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { MenusService } from "../MENUS/menus.services";
@Injectable()
export class RolesConfigService {
  constructor(
    @Inject("RolesRepository")
    private readonly RolesRepository: typeof RolesConfig,
    private menusService: MenusService
  ) {}

}
