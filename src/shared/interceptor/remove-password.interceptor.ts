import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
//it will take the response object and change the password in the data object.
@Injectable()
export class RemovePasswordInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((response) => {
        if (response?.data && typeof response?.data == "object") {
          if (response.data?.password != null) {
            response.data.password = true;
          } else {
            response.data.password = false;
          }
        }
        return response;
      })
    );
  }
}
