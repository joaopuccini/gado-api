"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllExceptionsFilter = void 0;
const common_1 = require("@nestjs/common");
const context_1 = require("../context");
let AllExceptionsFilter = class AllExceptionsFilter {
    logger = new common_1.Logger('ExceptionFilter');
    catch(exception, host) {
        const httpCtx = host.switchToHttp();
        const request = httpCtx.getRequest();
        const response = httpCtx.getResponse();
        const ctx = context_1.RequestContext.get();
        const requestId = ctx?.requestId || 'unknown';
        let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let code = 'INTERNAL_ERROR';
        let message = 'Erro interno do servidor';
        let details = undefined;
        if (exception instanceof common_1.HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
            }
            else if (typeof exceptionResponse === 'object') {
                const resp = exceptionResponse;
                message = resp.message || exception.message;
                details = resp.message;
                code = resp.error || this.getCodeFromStatus(status);
            }
            code = this.getCodeFromStatus(status);
        }
        else if (exception instanceof Error) {
            message = exception.message;
            this.logger.error(`[ReqId:${requestId.substring(0, 8)}] Unhandled exception: ${exception.message}`, exception.stack);
        }
        const module = this.detectModule(request.originalUrl);
        const errorBody = {
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
        this.logger.warn(`[ReqId:${requestId.substring(0, 8)}] ✗ ${request.method} ${request.originalUrl} → ${status} ${code}: ${Array.isArray(message) ? message.join(', ') : message}`);
        response.status(status).json(errorBody);
    }
    getCodeFromStatus(status) {
        const codeMap = {
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
    detectModule(url) {
        const segments = url.split('/').filter(Boolean);
        return segments[0] || 'root';
    }
};
exports.AllExceptionsFilter = AllExceptionsFilter;
exports.AllExceptionsFilter = AllExceptionsFilter = __decorate([
    (0, common_1.Catch)()
], AllExceptionsFilter);
//# sourceMappingURL=all-exceptions.filter.js.map