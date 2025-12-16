import {
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { Settings } from "./settings.entity";
import { DataResponseDto } from "../shared/dto/data-response-dto";
import { UpdateSettingsDto } from "./dto/updateSettings.dto";
import { getErrorMessage } from "../shared/helpers/errormessage";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import ProjectKeys from "../shared/constants/keynames";
const { settings_cache_key } = ProjectKeys;
@Injectable()
export class SettingsService {
  constructor(
    @Inject("SettingsRepository")
    private readonly SettingsRepository: typeof Settings,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  async findAll() {
    try {
      const data = await this.SettingsRepository.findOne({
        raw: true,
        attributes: { exclude: ["createdAt", "updatedAt"] },
      });
      await this.cacheManager.set(settings_cache_key, data);
      return new DataResponseDto(data);
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async update(id: number, data: UpdateSettingsDto) {
    try {
      const [status, [updated]] = await this.SettingsRepository.update(
        { ...data },
        { where: { id }, returning: true }
      );
      if (status == 0) throw new NotFoundException();
      await this.cacheManager.set(settings_cache_key, updated);
      return new DataResponseDto(updated, true, "Successfully Updated");
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new InternalServerErrorException(getErrorMessage(err));
    }
  }

  async getAdminEmail() {
    try {
      const settings = await this.SettingsRepository.findOne({});
      return settings.adminEmail;
    } catch (err) {
      return null;
    }
  }
}
