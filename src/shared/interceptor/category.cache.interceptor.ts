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
const { category_cache_key } = ProjectKeys;

@Injectable()
export class CategoryCacheInterceptor implements NestInterceptor {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}
  async intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Promise<Observable<any>> {
    const category = await this.cacheManager.get(category_cache_key);
    if (Array.isArray(category) && category?.length) {
      return of(new DataResponseDto(category));
    }
    return next.handle();
  }
}
