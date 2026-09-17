"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const context_1 = require("../context");
const domain_error_1 = require("../errors/domain-error");
const error_http_mapper_1 = require("../errors/error-http.mapper");
const structured_logger_service_1 = require("../logger/structured-logger.service");
const httpErrorByStatus = {
    [common_1.HttpStatus.BAD_REQUEST]: {
        code: 'validationFailed',
        message: 'Requisição inválida',
    },
    [common_1.HttpStatus.UNAUTHORIZED]: {
        code: 'unauthenticated',
        message: 'Autenticação necessária',
    },
    [common_1.HttpStatus.FORBIDDEN]: {
        code: 'forbidden',
        message: 'Acesso negado',
    },
    [common_1.HttpStatus.NOT_FOUND]: {
        code: 'resourceNotFound',
        message: 'Recurso não encontrado',
    },
    [common_1.HttpStatus.CONFLICT]: {
        code: 'conflict',
        message: 'Conflito de estado',
    },
    [common_1.HttpStatus.TOO_MANY_REQUESTS]: {
        code: 'rateLimitExceeded',
        message: 'Limite de requisições excedido',
    },
};
const validationDetails = (exception) => {
    const response = exception.getResponse();
    if (typeof response !== 'object' || response === null)
        return [];
    const messages = response.message;
    if (!Array.isArray(messages))
        return [];
    return messages
        .filter((message) => typeof message === 'string')
        .map((reason) => ({ reason }));
};
const prismaCode = (exception) => {
    if (typeof exception !== 'object' || exception === null)
        return undefined;
    const code = exception.code;
    return typeof code === 'string' ? code : undefined;
};
let GlobalExceptionFilter = class GlobalExceptionFilter {
    contextStore;
    logger;
    constructor(contextStore, logger) {
        this.contextStore = contextStore;
        this.logger = logger;
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const normalized = this.normalize(exception);
        const requestId = this.contextStore.current()?.requestId ?? 'unknown';
        const path = request.originalUrl || request.url;
        if (normalized.statusCode >= 500) {
            this.logger.error('exceptionCaught', {
                method: request.method,
                path,
                statusCode: normalized.statusCode,
                errorCode: normalized.code,
                errorName: exception instanceof Error ? exception.name : 'UnknownError',
                errorStack: exception instanceof Error ? exception.stack : undefined,
            });
        }
        const body = {
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
    normalize(exception) {
        if (exception instanceof domain_error_1.DomainError) {
            return (0, error_http_mapper_1.mapDomainErrorToHttp)(exception);
        }
        if (exception instanceof common_1.HttpException) {
            const statusCode = exception.getStatus();
            const fallback = httpErrorByStatus[statusCode];
            const details = validationDetails(exception);
            return {
                statusCode,
                code: fallback?.code ?? 'internalServerError',
                message: details.length > 0
                    ? 'Falha de validação'
                    : (fallback?.message ?? 'Erro interno do servidor'),
                ...(details.length > 0 ? { details } : {}),
            };
        }
        switch (prismaCode(exception)) {
            case 'P2002':
                return {
                    statusCode: common_1.HttpStatus.CONFLICT,
                    code: 'conflict',
                    message: 'Conflito de estado',
                };
            case 'P2025':
                return {
                    statusCode: common_1.HttpStatus.NOT_FOUND,
                    code: 'resourceNotFound',
                    message: 'Recurso não encontrado',
                };
            default:
                return {
                    statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                    code: 'internalServerError',
                    message: 'Erro interno do servidor',
                };
        }
    }
};
exports.GlobalExceptionFilter = GlobalExceptionFilter;
exports.GlobalExceptionFilter = GlobalExceptionFilter = __decorate([
    (0, common_1.Catch)(),
    __metadata("design:paramtypes", [context_1.ExecutionContextStore,
        structured_logger_service_1.StructuredLogger])
], GlobalExceptionFilter);
//# sourceMappingURL=global-exception.filter.js.map