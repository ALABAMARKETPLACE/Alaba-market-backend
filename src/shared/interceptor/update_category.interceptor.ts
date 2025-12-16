import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  InternalServerErrorException,
} from "@nestjs/common";
import { Observable, catchError, tap, throwError } from "rxjs";
import { CategoryService } from "../../CATEGORY/category.services";
import { getErrorMessage } from "../helpers/errormessage";
//this interceptor will update the cache by running the below sevice.
@Injectable()
export class CategoryUpdateInterceptor implements NestInterceptor {
  constructor(private readonly categoryService: CategoryService) {}
  async intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Promise<Observable<any>> {
    return next.handle().pipe(
      tap(async (response) => {
        try {
          await this.categoryService.findAllCategory();
        } catch (error) {}
      }),
      catchError((error) => {
        if (error instanceof HttpException) {
          throw error;
        }
        throw new InternalServerErrorException(getErrorMessage(error));
      })
    );
  }
}
