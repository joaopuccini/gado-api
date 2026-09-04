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
var VendasService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VendasService = void 0;
const common_1 = require("@nestjs/common");
const tenant_prisma_service_1 = require("../tenant/tenant-prisma.service");
const services_1 = require("../common/services");
let VendasService = VendasService_1 = class VendasService extends services_1.BaseTenantService {
    logger = new common_1.Logger(VendasService_1.name);
    modelName = 'Venda';
    constructor(tenantPrisma) { super(tenantPrisma); }
    getDelegate(tenant) { return tenant.venda; }
    async create(dto) {
        const tenant = this.getTenantClient();
        const venda = await tenant.venda.create({
            data: {
                clienteId: dto.id_cliente,
                valorTotal: dto.valor_venda,
                custoTotal: dto.valor_custo || 0,
                lucro: (dto.valor_venda || 0) - (dto.valor_custo || 0),
                dataVenda: dto.data_venda ? new Date(dto.data_venda) : new Date(),
                observacao: dto.observacao,
                ativo: true,
            },
        });
        if (dto.id_animais && dto.id_animais.length > 0) {
            await tenant.animal.updateMany({
                where: { id: { in: dto.id_animais } },
                data: { status: 'VENDIDO' },
            });
            const valorVendaCabeca = dto.valor_venda / dto.id_animais.length;
            const valorCustoCabeca = (dto.valor_custo || 0) / dto.id_animais.length;
            const vendaAnimaisData = dto.id_animais.map(animalId => ({
                vendaId: venda.id,
                animalId: animalId,
                valorFinal: valorVendaCabeca,
                custoFinal: valorCustoCabeca,
            }));
            await tenant.itemVenda.createMany({
                data: vendaAnimaisData,
            });
        }
        return venda;
    }
};
exports.VendasService = VendasService;
exports.VendasService = VendasService = VendasService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [tenant_prisma_service_1.TenantPrismaService])
], VendasService);
//# sourceMappingURL=vendas.service.js.map