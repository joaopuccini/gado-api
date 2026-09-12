import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ExecutionContextStore } from '../context';
import { DomainError } from '../errors/domain-error';
import { mapDomainErrorToHttp } from '../errors/error-http.mapper';
import type { ErrorCode, ErrorDetail } from '../errors/error-catalog';

interface ApiErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    details?: readonly ErrorDetail[];
  };
  meta: {
    requestId: string;
    timestamp: string;
    path: string;
  };
}

interface NormalizedError {
  statusCode: number;
  code: ErrorCode;
  message: string;
  details?: readonly ErrorDetail[];
}

const httpErrorByStatus: Readonly<
  Record<number, Pick<NormalizedError, 'code' | 'message'>>
> = {
  [HttpStatus.BAD_REQUEST]: {
    code: 'validationFailed',
    message: 'Requisição inválida',
  },
  [HttpStatus.UNAUTHORIZED]: {
    code: 'unauthenticated',
    message: 'Autenticação necessária',
  },
  [HttpStatus.FORBIDDEN]: {
    code: 'forbidden',
    message: 'Acesso negado',
  },
  [HttpStatus.NOT_FOUND]: {
    code: 'resourceNotFound',
    message: 'Recurso não encontrado',
  },
  [HttpStatus.CONFLICT]: {
    code: 'conflict',
    message: 'Conflito de estado',
  },
  [HttpStatus.TOO_MANY_REQUESTS]: {
    code: 'rateLimitExceeded',
    message: 'Limite de requisições excedido',
  },
};

const validationDetails = (exception: HttpException): ErrorDetail[] => {
  const response = exception.getResponse();
  if (typeof response !== 'object' || response === null) return [];

  const messages = (response as Record<string, unknown>).message;
  if (!Array.isArray(messages)) return [];

  return messages
    .filter((message): message is string => typeof message === 'string')
    .map((reason) => ({ reason }));
};

const prismaCode = (exception: unknown): string | undefined => {
  if (typeof exception !== 'object' || exception === null) return undefined;
  const code = (exception as Record<string, unknown>).code;
  return typeof code === 'string' ? code : undefined;
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly contextStore: ExecutionContextStore) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const normalized = this.normalize(exception);
    const requestId = this.contextStore.current()?.requestId ?? 'unknown';
    const path = request.originalUrl || request.url;

    if (normalized.statusCode >= 500) {
      this.logger.error(
        `${request.method} ${path} failed [requestId=${requestId}]`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    const body: ApiErrorResponse = {
      error: {
        code: normalized.code,
        message: normalized.message,
        ...(normalized.details?.length ? { details: normalized.details } : {}),
      },
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
        path,
      },
    };

    response.status(normalized.statusCode).json(body);
  }

  private normalize(exception: unknown): NormalizedError {
    if (exception instanceof DomainError) {
      return mapDomainErrorToHttp(exception);
    }

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const fallback = httpErrorByStatus[statusCode];
      const details = validationDetails(exception);
      return {
        statusCode,
        code: fallback?.code ?? 'internalServerError',
        message:
          details.length > 0
            ? 'Falha de validação'
            : (fallback?.message ?? 'Erro interno do servidor'),
        ...(details.length > 0 ? { details } : {}),
      };
    }

    switch (prismaCode(exception)) {
      case 'P2002':
        return {
          statusCode: HttpStatus.CONFLICT,
          code: 'conflict',
          message: 'Conflito de estado',
        };
      case 'P2025':
        return {
          statusCode: HttpStatus.NOT_FOUND,
          code: 'resourceNotFound',
          message: 'Recurso não encontrado',
        };
      default:
        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          code: 'internalServerError',
          message: 'Erro interno do servidor',
        };
    }
  }
}
