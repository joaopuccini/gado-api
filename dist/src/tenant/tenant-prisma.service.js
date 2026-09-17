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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantPrismaService = void 0;
const common_1 = require("@nestjs/common");
const context_1 = require("../common/context");
const tenant_prisma_client_factory_port_1 = require("./application/ports/tenant-prisma-client-factory.port");
const tenant_schema_name_1 = require("./domain/tenant-schema-name");
let TenantPrismaService = class TenantPrismaService {
    contextStore;
    clientFactory;
    constructor(contextStore, clientFactory) {
        this.contextStore = contextStore;
        this.clientFactory = clientFactory;
    }
    getClient() {
        const context = this.contextStore.requireTenant();
        return this.clientFactory.create(tenant_schema_name_1.TenantSchemaName.parse(context.schemaName));
    }
    getContext() {
        return this.contextStore.requireTenant();
    }
};
exports.TenantPrismaService = TenantPrismaService;
exports.TenantPrismaService = TenantPrismaService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(tenant_prisma_client_factory_port_1.TENANT_PRISMA_CLIENT_FACTORY)),
    __metadata("design:paramtypes", [context_1.ExecutionContextStore, Object])
], TenantPrismaService);
//# sourceMappingURL=tenant-prisma.service.js.map