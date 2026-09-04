"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantContext = void 0;
const async_hooks_1 = require("async_hooks");
class TenantContext {
    static storage = new async_hooks_1.AsyncLocalStorage();
    static run(tenant, fn) {
        return this.storage.run(tenant, fn);
    }
    static get() {
        return this.storage.getStore();
    }
    static getOrFail() {
        const tenant = this.storage.getStore();
        if (!tenant) {
            throw new Error('TenantContext não disponível - middleware não configurado ou contexto admin');
        }
        return tenant;
    }
    static getSchemaName() {
        return this.storage.getStore()?.schemaName;
    }
    static getTenantId() {
        return this.storage.getStore()?.tenantId;
    }
}
exports.TenantContext = TenantContext;
//# sourceMappingURL=tenant.context.js.map