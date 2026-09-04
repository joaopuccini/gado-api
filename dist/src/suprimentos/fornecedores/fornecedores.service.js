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
var FornecedoresService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FornecedoresService = void 0;
const common_1 = require("@nestjs/common");
const base_tenant_service_1 = require("../../common/services/base-tenant.service");
const tenant_prisma_service_1 = require("../../tenant/tenant-prisma.service");
let FornecedoresService = FornecedoresService_1 = class FornecedoresService extends base_tenant_service_1.BaseTenantService {
    tenantPrisma;
    logger = new common_1.Logger(FornecedoresService_1.name);
    modelName = 'fornecedor';
    constructor(tenantPrisma) {
        super(tenantPrisma);
        this.tenantPrisma = tenantPrisma;
    }
    getDelegate(tenant) {
        return tenant.fornecedor;
    }
};
exports.FornecedoresService = FornecedoresService;
exports.FornecedoresService = FornecedoresService = FornecedoresService_1 = __decorate([
    (0, common_1.Injectable)({ scope: common_1.Scope.REQUEST }),
    __metadata("design:paramtypes", [tenant_prisma_service_1.TenantPrismaService])
], FornecedoresService);
//# sourceMappingURL=fornecedores.service.js.map