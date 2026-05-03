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
const prisma_service_1 = require("../prisma/prisma.service");
const services_1 = require("../common/services");
let VendasService = VendasService_1 = class VendasService extends services_1.BaseTenantService {
    logger = new common_1.Logger(VendasService_1.name);
    modelName = 'Venda';
    constructor(prisma) { super(prisma); }
    getDelegate() { return this.prisma.venda; }
    async create(dto) {
        return this.withTenant(async () => {
            const venda = await this.prisma.venda.create({
                data: {
                    id_animais: dto.id_animais,
                    id_cliente: dto.id_cliente,
                    qtd_animais: dto.id_animais.length,
                    valor_venda: dto.valor_venda,
                    valor_custo: dto.valor_custo || 0,
                    data_venda: dto.data_venda ? new Date(dto.data_venda) : new Date(),
                    observacao: dto.observacao,
                },
            });
            await this.prisma.animal.updateMany({
                where: { id: { in: dto.id_animais } },
                data: { status: 'VENDIDO' },
            });
            const valorVendaCabeca = dto.valor_venda / dto.id_animais.length;
            const valorCustoCabeca = (dto.valor_custo || 0) / dto.id_animais.length;
            const vendaAnimaisData = dto.id_animais.map(animalId => ({
                id_venda: venda.id,
                id_animal: animalId,
                valor_final: valorVendaCabeca,
                valor_custo_final: valorCustoCabeca,
            }));
            await this.prisma.vendaAnimal.createMany({
                data: vendaAnimaisData,
            });
            return venda;
        });
    }
};
exports.VendasService = VendasService;
exports.VendasService = VendasService = VendasService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], VendasService);
//# sourceMappingURL=vendas.service.js.map