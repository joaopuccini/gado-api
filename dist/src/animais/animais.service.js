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
var AnimaisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnimaisService = void 0;
const common_1 = require("@nestjs/common");
const tenant_prisma_service_1 = require("../tenant/tenant-prisma.service");
const services_1 = require("../common/services");
const request_context_1 = require("../common/context/request-context");
let AnimaisService = AnimaisService_1 = class AnimaisService extends services_1.BaseTenantService {
    logger = new common_1.Logger(AnimaisService_1.name);
    modelName = 'Animal';
    constructor(tenantPrisma) {
        super(tenantPrisma);
    }
    getDelegate() {
        return this.getTenantClient().animal;
    }
    async findAll(options) {
        return super.findAll({
            ...options,
            include: {
                lote: true,
                raca: true,
                pasto: true,
                cliente: true,
            },
        });
    }
    async findOne(id) {
        return super.findOne(id, {
            lote: true,
            raca: true,
            pasto: true,
            cliente: true,
            vacinacoes: true,
            fotos: true,
            pesagens: { orderBy: { dataPesagem: 'desc' }, take: 5 },
        });
    }
    async seed() {
        const prisma = this.getTenantClient();
        let fazenda = await prisma.fazenda.findFirst();
        if (!fazenda) {
            fazenda = await prisma.fazenda.create({ data: { nome: 'Fazenda Modelo', ativo: true } });
        }
        let raca = await prisma.raca.findFirst();
        if (!raca) {
            raca = await prisma.raca.create({ data: { descricao: 'Nelore' } });
        }
        let lote = await prisma.lote.findFirst();
        if (!lote) {
            lote = await prisma.lote.create({ data: { descricao: 'Lote Engorda', fazendaId: fazenda.id } });
        }
        let pasto = await prisma.pasto.findFirst();
        if (!pasto) {
            pasto = await prisma.pasto.create({ data: { descricao: 'Pasto Central', fazendaId: fazenda.id } });
        }
        const animalsToCreate = [];
        for (let i = 1; i <= 25; i++) {
            const pesoBase = 300 + Math.random() * 200;
            animalsToCreate.push({
                fazendaId: fazenda.id,
                racaId: raca.id,
                loteId: lote.id,
                pastoId: pasto.id,
                numeroBrinco: `B-${1000 + i}`,
                status: 'ATIVO',
                pesoAtual: pesoBase,
                valorCustoTotal: pesoBase * 10,
                sexo: i % 2 === 0 ? 'MACHO' : 'FEMEA',
                dataEntrada: new Date(),
            });
        }
        await prisma.animal.createMany({
            data: animalsToCreate,
        });
        const createdAnimals = await prisma.animal.findMany({ take: 25 });
        const pesagensToCreate = [];
        for (const animal of createdAnimals) {
            pesagensToCreate.push({
                animalId: animal.id,
                peso: Number(animal.pesoAtual) - 20,
                dataPesagem: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            });
            pesagensToCreate.push({
                animalId: animal.id,
                peso: Number(animal.pesoAtual),
                dataPesagem: new Date(),
            });
        }
        await prisma.pesagem.createMany({ data: pesagensToCreate });
        return { message: '25 animais gerados com sucesso' };
    }
    async transferir(id, dto) {
        const tenant = this.getTenantClient();
        const currentFazendaId = request_context_1.RequestContext.getFazendaId();
        const accessibleFazendaIds = request_context_1.RequestContext.getAccessibleFazendaIds() || (currentFazendaId ? [currentFazendaId] : []);
        if (!accessibleFazendaIds.includes(dto.fazendaDestinoId)) {
            throw new Error('Você não tem acesso à fazenda de destino.');
        }
        const animal = await this.findOne(id);
        if (!animal) {
            throw new Error('Animal não encontrado.');
        }
        return tenant.$transaction(async (tx) => {
            await tx.transferenciaAnimal.create({
                data: {
                    animalId: animal.id,
                    fazendaOrigemId: animal.fazendaId,
                    fazendaDestinoId: dto.fazendaDestinoId,
                    pastoDestinoId: dto.pastoDestinoId,
                    loteDestinoId: dto.loteDestinoId,
                    observacao: dto.observacao,
                },
            });
            const updatedAnimal = await tx.animal.update({
                where: { id: animal.id },
                data: {
                    fazendaId: dto.fazendaDestinoId,
                    pastoId: dto.pastoDestinoId ?? animal.pastoId,
                    loteId: dto.loteDestinoId ?? animal.loteId,
                },
            });
            return updatedAnimal;
        });
    }
};
exports.AnimaisService = AnimaisService;
exports.AnimaisService = AnimaisService = AnimaisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [tenant_prisma_service_1.TenantPrismaService])
], AnimaisService);
//# sourceMappingURL=animais.service.js.map