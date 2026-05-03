import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { RequestContext } from '../context';

interface ErrorResponseBody {
    success: false;
    error: {
        code: string;
        message: string;
        details?: unknown;
        module?: string;
    };
    meta: {
        requestId: string;
        timestamp: string;
        path: string;
        method: string;
    };
}

/**
 * AllExceptionsFilter — Equivalente ao @ControllerAdvice do Spring.
 *
 * Centraliza TODOS os erros da aplicação num único ponto.
 * Garante que:
 * 1. Todo erro retorna um formato consistente ao cliente
 * 2. Erros internos nunca vazam stack traces para o cliente
 * 3. Cada erro é logado com requestId para rastreabilidade
 * 4. O módulo de origem é identificado no response
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger('ExceptionFilter');

    catch(exception: unknown, host: ArgumentsHost): void {
        const httpCtx = host.switchToHttp();
        const request = httpCtx.getRequest<Request>();
        const response = httpCtx.getResponse<Response>();
        const ctx = RequestContext.get();
        const requestId = ctx?.requestId || 'unknown';

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let code = 'INTERNAL_ERROR';
        let message = 'Erro interno do servidor';
        let details: unknown = undefined;

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
            } else if (typeof exceptionResponse === 'object') {
                const resp = exceptionResponse as Record<string, unknown>;
                message = (resp.message as string) || exception.message;
                details = resp.message; // class-validator errors array
                code = (resp.error as string) || this.getCodeFromStatus(status);
            }

            code = this.getCodeFromStatus(status);
        } else if (exception instanceof Error) {
            message = exception.message;
            // Log full stack for unexpected errors (not sent to client)
            this.logger.error(
                `[ReqId:${requestId.substring(0, 8)}] Unhandled exception: ${exception.message}`,
                exception.stack,
            );
        }

        // Detect module from controller path
        const module = this.detectModule(request.originalUrl);

        const errorBody: ErrorResponseBody = {
            success: false,
            error: {
                code,
                message: Array.isArray(message) ? message[0] : message,
                details: Array.isArray(details) ? details : undefined,
                module,
            },
            meta: {
                requestId,
                timestamp: new Date().toISOString(),
                path: request.originalUrl,
                method: request.method,
            },
        };

        // Log the error with context
        this.logger.warn(
            `[ReqId:${requestId.substring(0, 8)}] ✗ ${request.method} ${request.originalUrl} → ${status} ${code}: ${Array.isArray(message) ? message.join(', ') : message}`,
        );

        response.status(status).json(errorBody);
    }

    private getCodeFromStatus(status: number): string {
        const codeMap: Record<number, string> = {
            400: 'BAD_REQUEST',
            401: 'UNAUTHORIZED',
            403: 'FORBIDDEN',
            404: 'NOT_FOUND',
            409: 'CONFLICT',
            422: 'UNPROCESSABLE_ENTITY',
            429: 'TOO_MANY_REQUESTS',
            500: 'INTERNAL_ERROR',
        };
        return codeMap[status] || 'UNKNOWN_ERROR';
    }

    private detectModule(url: string): string {
        const segments = url.split('/').filter(Boolean);
        // Return first meaningful segment as module name
        return segments[0] || 'root';
    }
}
