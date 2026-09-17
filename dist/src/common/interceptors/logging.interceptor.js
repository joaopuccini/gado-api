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
exports.LoggingInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const structured_logger_service_1 = require("../logger/structured-logger.service");
let LoggingInterceptor = class LoggingInterceptor {
    logger;
    constructor(logger) {
        this.logger = logger;
    }
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        const startedAt = Date.now();
        const fields = {
            method: request.method,
            path: request.originalUrl,
            module: context.getClass().name,
            operation: context.getHandler().name,
        };
        let outcome = 'success';
        let errorStatusCode;
        this.logger.info('httpRequestStarted', fields);
        return next.handle().pipe((0, rxjs_1.tap)({
            error: (error) => {
                outcome = 'error';
                errorStatusCode =
                    error instanceof common_1.HttpException ? error.getStatus() : 500;
            },
        }), (0, rxjs_1.finalize)(() => {
            this.logger.info('httpRequestCompleted', {
                ...fields,
                statusCode: errorStatusCode ?? response.statusCode,
                durationMs: Math.max(0, Date.now() - startedAt),
                outcome,
            });
        }));
    }
};
exports.LoggingInterceptor = LoggingInterceptor;
exports.LoggingInterceptor = LoggingInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [structured_logger_service_1.StructuredLogger])
], LoggingInterceptor);
//# sourceMappingURL=logging.interceptor.js.map