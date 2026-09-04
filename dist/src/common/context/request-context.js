"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestContext = void 0;
const async_hooks_1 = require("async_hooks");
const uuid_1 = require("uuid");
class RequestContext {
    static storage = new async_hooks_1.AsyncLocalStorage();
    static run(data, fn) {
        const context = {
            requestId: data.requestId || (0, uuid_1.v4)(),
            globalUserId: data.globalUserId,
            userId: data.userId,
            userEmail: data.userEmail,
            tenantId: data.tenantId,
            schemaName: data.schemaName,
            fazendaId: data.fazendaId,
            accessibleFazendaIds: data.accessibleFazendaIds,
            path: data.path,
            method: data.method,
            startTime: data.startTime || Date.now(),
        };
        return this.storage.run(context, fn);
    }
    static get() {
        return this.storage.getStore();
    }
    static getRequestId() {
        return this.get()?.requestId || 'no-request-id';
    }
    static getFazendaId() {
        return this.get()?.fazendaId;
    }
    static getAccessibleFazendaIds() {
        return this.get()?.accessibleFazendaIds;
    }
    static getUserId() {
        return this.get()?.userId;
    }
    static getGlobalUserId() {
        return this.get()?.globalUserId;
    }
    static getTenantId() {
        return this.get()?.tenantId;
    }
    static getSchemaName() {
        return this.get()?.schemaName;
    }
    static set(partial) {
        const current = this.get();
        if (current) {
            Object.assign(current, partial);
        }
    }
}
exports.RequestContext = RequestContext;
//# sourceMappingURL=request-context.js.map