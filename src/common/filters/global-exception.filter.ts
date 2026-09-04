import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { RequestContext } from '../context/request-context';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = RequestContext.getRequestId();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: 'Internal server error' };

    const message =
      typeof errorResponse === 'string'
        ? errorResponse
        : (errorResponse as any).message || errorResponse;

    // Log the error internally (the CustomLogger will inject the RequestId automatically, but we can also log the stack trace here if it's 500)
    if (status >= 500) {
      this.logger.error(`[RequestId: ${requestId}] ${request.method} ${request.url} - ${exception instanceof Error ? exception.message : 'Unknown Error'}`, exception instanceof Error ? exception.stack : undefined);
    } else {
      this.logger.warn(`[RequestId: ${requestId}] ${request.method} ${request.url} - ${status} - ${JSON.stringify(message)}`);
    }

    // Send standardized clean response to client
    response.status(status).json({
      success: false,
      error: {
        statusCode: status,
        message: message,
        path: request.url,
        timestamp: new Date().toISOString(),
        requestId: requestId,
      },
    });
  }
}
