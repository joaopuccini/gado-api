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
const prisma_service_1 = require("../prisma/prisma.service");
const services_1 = require("../common/services");
let CustosService = CustosService_1 = class CustosService extends services_1.BaseTenantService {
    logger = new common_1.Logger(CustosService_1.name);
    modelName = 'Custo';
    constructor(prisma) { super(prisma); }
    getDelegate() { return this.prisma.custo; }
    async create(dto) {
        return this.withTenant(async () => {
            const custo = await this.prisma.custo.create({
                data: {
                    id_animais: dto.id_animais,
                    id_custo_tipos: dto.id_custo_tipos,
                    qtd_animais: dto.id_animais.length,
                    descricao: dto.descricao,
                    valor_custo: dto.valor_custo,
                    data_custo: dto.data_custo ? new Date(dto.data_custo) : new Date(),
                },
            });
            const valorPorCabeca = dto.valor_custo / dto.id_animais.length;
            const custoAnimaisData = dto.id_animais.map(animalId => ({
                id_custo: custo.id,
                id_animal: animalId,
                valor_cabeca: valorPorCabeca,
            }));
            await this.prisma.custoAnimal.createMany({
                data: custoAnimaisData,
            });
            return custo;
        });
    }
};
exports.CustosService = CustosService;
exports.CustosService = CustosService = CustosService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CustosService);
let CustoTiposService = CustoTiposService_1 = class CustoTiposService extends services_1.BaseTenantService {
    logger = new common_1.Logger(CustoTiposService_1.name);
    modelName = 'Custo Tipo';
    constructor(prisma) { super(prisma); }
    getDelegate() { return this.prisma.custoTipo; }
};
exports.CustoTiposService = CustoTiposService;
exports.CustoTiposService = CustoTiposService = CustoTiposService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CustoTiposService);
//# sourceMappingURL=custos.service.js.map