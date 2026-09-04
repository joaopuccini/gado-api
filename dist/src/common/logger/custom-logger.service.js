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
exports.CustomLogger = void 0;
const common_1 = require("@nestjs/common");
const request_context_1 = require("../context/request-context");
let CustomLogger = class CustomLogger extends common_1.ConsoleLogger {
    constructor(context) {
        super(context || 'App');
    }
    addRequestId(message) {
        const requestId = request_context_1.RequestContext.getRequestId();
        const prefix = requestId !== 'no-request-id' ? `[ReqID: ${requestId.substring(0, 8)}] ` : '';
        return `${prefix}${message}`;
    }
    log(message, context) {
        super.log(this.addRequestId(message), context);
    }
    error(message, stack, context) {
        super.error(this.addRequestId(message), stack, context);
    }
    warn(message, context) {
        super.warn(this.addRequestId(message), context);
    }
    debug(message, context) {
        super.debug(this.addRequestId(message), context);
    }
    verbose(message, context) {
        super.verbose(this.addRequestId(message), context);
    }
};
exports.CustomLogger = CustomLogger;
exports.CustomLogger = CustomLogger = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [String])
], CustomLogger);
//# sourceMappingURL=custom-logger.service.js.map