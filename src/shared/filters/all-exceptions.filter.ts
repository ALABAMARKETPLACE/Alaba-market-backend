import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: any = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.getResponse();
    }

    this.logger.error({
      event: "http_exception",
      requestId: request.id,
      method: request.method,
      path: String(request.url || "").split("?")[0],
      status,
      message,
      stack: exception instanceof Error ? exception.stack : null,
      userId: request.user?.id,
      storeId: request.user?.storeId,
    });

    response.status(status).json({
      statusCode: status,
      message,
      path: request.url,
      requestId: request.id,
      timestamp: new Date().toISOString(),
    });
  }
}
