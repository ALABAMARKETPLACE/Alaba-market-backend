import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from "@nestjs/common";
import { Observable, of } from "rxjs";
import { DataResponseDto } from "../dto/data-response-dto";
import ProjectKeys from "../constants/keynames";
const { settings_cache_key } = ProjectKeys;

@Injectable()
export class SettingsCacheInterceptor implements NestInterceptor {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}
  async intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Promise<Observable<any>> {
    const settings = await this.cacheManager.get(settings_cache_key);
    if (settings && typeof settings == "object") {
      return of(new DataResponseDto(settings));
    }
    return next.handle();
  }
}
