"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const tenant_middleware_1 = require("./tenant.middleware");
const tenant_registry_service_1 = require("./tenant-registry.service");
const tenant_prisma_service_1 = require("./tenant-prisma.service");
let TenantModule = class TenantModule {
    configure(consumer) {
        consumer
            .apply(tenant_middleware_1.TenantMiddleware)
            .exclude('admin/(.*)', 'health', 'api', 'api/(.*)')
            .forRoutes('*');
    }
};
exports.TenantModule = TenantModule;
exports.TenantModule = TenantModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [config_1.ConfigModule],
        providers: [
            tenant_registry_service_1.TenantRegistryService,
            tenant_prisma_service_1.TenantPrismaService,
        ],
        exports: [
            tenant_registry_service_1.TenantRegistryService,
            tenant_prisma_service_1.TenantPrismaService,
        ],
    })
], TenantModule);
//# sourceMappingURL=tenant.module.js.map