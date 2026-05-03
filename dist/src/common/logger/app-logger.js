"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppLogger = void 0;
const common_1 = require("@nestjs/common");
const context_1 = require("../context");
let AppLogger = class AppLogger extends common_1.ConsoleLogger {
    withReqId(message) {
        const ctx = context_1.RequestContext.get();
        const msgStr = typeof message === 'string' ? message : String(message);
        if (ctx) {
            return `[ReqId:${ctx.requestId.substring(0, 8)}] ${msgStr}`;
        }
        return msgStr;
    }
    log(message, ...optionalParams) {
        super.log(this.withReqId(message), ...optionalParams);
    }
    error(message, ...optionalParams) {
        super.error(this.withReqId(message), ...optionalParams);
    }
    warn(message, ...optionalParams) {
        super.warn(this.withReqId(message), ...optionalParams);
    }
    debug(message, ...optionalParams) {
        super.debug(this.withReqId(message), ...optionalParams);
    }
    verbose(message, ...optionalParams) {
        super.verbose(this.withReqId(message), ...optionalParams);
    }
};
exports.AppLogger = AppLogger;
exports.AppLogger = AppLogger = __decorate([
    (0, common_1.Injectable)()
], AppLogger);
//# sourceMappingURL=app-logger.js.map