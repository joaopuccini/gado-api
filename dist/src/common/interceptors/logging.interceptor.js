"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const context_1 = require("../context");
let LoggingInterceptor = class LoggingInterceptor {
    logger = new common_1.Logger('HTTP');
    intercept(context, next) {
        const req = context.switchToHttp().getRequest();
        const { method, originalUrl, ip } = req;
        const ctx = context_1.RequestContext.get();
        const requestId = ctx?.requestId?.substring(0, 8) || '--------';
        const controller = context.getClass().name;
        const handler = context.getHandler().name;
        this.logger.log(`[ReqId:${requestId}] → ${method} ${originalUrl} | ${controller}.${handler} | IP:${ip}`);
        return next.handle().pipe((0, rxjs_1.tap)({
            next: () => {
                const res = context.switchToHttp().getResponse();
                const duration = ctx ? Date.now() - ctx.startTime : 0;
                this.logger.log(`[ReqId:${requestId}] ← ${method} ${originalUrl} ${res.statusCode} [${duration}ms]`);
            },
            error: (error) => {
                const duration = ctx ? Date.now() - ctx.startTime : 0;
                const status = error?.status || error?.getStatus?.() || 500;
                this.logger.error(`[ReqId:${requestId}] ✗ ${method} ${originalUrl} ${status} [${duration}ms] | ${error?.message}`);
            },
        }));
    }
};
exports.LoggingInterceptor = LoggingInterceptor;
exports.LoggingInterceptor = LoggingInterceptor = __decorate([
    (0, common_1.Injectable)()
], LoggingInterceptor);
//# sourceMappingURL=logging.interceptor.js.map