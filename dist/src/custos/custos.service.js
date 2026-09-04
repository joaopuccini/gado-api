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
var CustosService_1, CustoTiposService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustoTiposService = exports.CustosService = void 0;
const common_1 = require("@nestjs/common");
const tenant_prisma_service_1 = require("../tenant/tenant-prisma.service");
const services_1 = require("../common/services");
let CustosService = CustosService_1 = class CustosService extends services_1.BaseTenantService {
    logger = new common_1.Logger(CustosService_1.name);
    modelName = 'Custo';
    constructor(tenantPrisma) { super(tenantPrisma); }
    getDelegate(tenant) { return tenant.custo; }
    async create(dto) {
        const tenant = this.getTenantClient();
        const custo = await tenant.custo.create({
            data: {
                categoriaCustoId: dto.id_custo_tipos,
                descricao: dto.descricao,
                valorTotal: dto.valor_custo,
                dataCusto: dto.data_custo ? new Date(dto.data_custo) : new Date(),
                ativo: true,
            },
        });
        if (dto.id_animais && dto.id_animais.length > 0) {
            const valorPorCabeca = dto.valor_custo / dto.id_animais.length;
            const custoAnimaisData = dto.id_animais.map(animalId => ({
                custoId: custo.id,
                animalId: animalId,
                valorCabeca: valorPorCabeca,
            }));
            await tenant.custoAnimal.createMany({
                data: custoAnimaisData,
            });
        }
        return custo;
    }
};
exports.CustosService = CustosService;
exports.CustosService = CustosService = CustosService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [tenant_prisma_service_1.TenantPrismaService])
], CustosService);
let CustoTiposService = CustoTiposService_1 = class CustoTiposService extends services_1.BaseTenantService {
    logger = new common_1.Logger(CustoTiposService_1.name);
    modelName = 'CategoriaCusto';
    constructor(tenantPrisma) { super(tenantPrisma); }
    getDelegate(tenant) { return tenant.categoriaCusto; }
};
exports.CustoTiposService = CustoTiposService;
exports.CustoTiposService = CustoTiposService = CustoTiposService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [tenant_prisma_service_1.TenantPrismaService])
], CustoTiposService);
//# sourceMappingURL=custos.service.js.map