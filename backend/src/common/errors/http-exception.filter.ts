import { ExceptionFilter, Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { toAppError } from './errors.js';

const logger = new Logger('HttpExceptionFilter');

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const errorResponse = toAppError(exception).getResponse();
    const statusCode = errorResponse.statusCode;

    logger.error(
      `${request.method} ${request.url} — ${errorResponse.code}: ${errorResponse.message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(statusCode).json(errorResponse);
  }
}
