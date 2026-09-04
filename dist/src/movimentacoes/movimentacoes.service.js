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
var MovimentoPastoService_1, MovimentoLoteService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MovimentoLoteService = exports.MovimentoPastoService = void 0;
const common_1 = require("@nestjs/common");
const tenant_prisma_service_1 = require("../tenant/tenant-prisma.service");
const services_1 = require("../common/services");
let MovimentoPastoService = MovimentoPastoService_1 = class MovimentoPastoService extends services_1.BaseTenantService {
    logger = new common_1.Logger(MovimentoPastoService_1.name);
    modelName = 'Movimentação Pasto';
    constructor(tenantPrisma) { super(tenantPrisma); }
    getDelegate(tenant) { return tenant.movimentoAnimalPasto; }
};
exports.MovimentoPastoService = MovimentoPastoService;
exports.MovimentoPastoService = MovimentoPastoService = MovimentoPastoService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [tenant_prisma_service_1.TenantPrismaService])
], MovimentoPastoService);
let MovimentoLoteService = MovimentoLoteService_1 = class MovimentoLoteService extends services_1.BaseTenantService {
    logger = new common_1.Logger(MovimentoLoteService_1.name);
    modelName = 'Movimentação Lote';
    constructor(tenantPrisma) { super(tenantPrisma); }
    getDelegate(tenant) { return tenant.movimentoLote; }
};
exports.MovimentoLoteService = MovimentoLoteService;
exports.MovimentoLoteService = MovimentoLoteService = MovimentoLoteService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [tenant_prisma_service_1.TenantPrismaService])
], MovimentoLoteService);
//# sourceMappingURL=movimentacoes.service.js.map