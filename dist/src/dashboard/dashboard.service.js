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
var DashboardService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const context_1 = require("../common/context");
let DashboardService = DashboardService_1 = class DashboardService {
    prisma;
    logger = new common_1.Logger(DashboardService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async withTenant(operation) {
        const fazendaId = context_1.RequestContext.getFazendaId();
        await this.prisma.$executeRawUnsafe(`SET search_path TO "fazenda_${fazendaId}", public`);
        try {
            return await operation();
        }
        finally {
            await this.prisma.$executeRawUnsafe(`SET search_path TO "gado_fazendas", public`);
        }
    }
    async getStats() {
        return this.withTenant(async () => {
            const [totalAnimais, totalVendido, totalMorte, totalLotes, totalPastos] = await Promise.all([
                this.prisma.animal.count({ where: { excluido: false, status: 'ATIVO' } }),
                this.prisma.animal.count({ where: { excluido: false, status: 'VENDIDO' } }),
                this.prisma.animal.count({ where: { excluido: false, status: 'MORTO' } }),
                this.prisma.lote.count({ where: { excluido: false } }),
                this.prisma.pasto.count({ where: { excluido: false } }),
            ]);
            const resumoFinanceiro = await this.prisma.caixa.aggregate({
                where: { excluido: false },
                _sum: { valor: true },
            });
            return {
                counters: {
                    ativos: totalAnimais,
                    vendidos: totalVendido,
                    mortes: totalMorte,
                    lotes: totalLotes,
                    pastos: totalPastos,
                },
                financeiro: {
                    saldo_caixa: resumoFinanceiro._sum.valor || 0,
                }
            };
        });
    }
    async getTotalMachoFemea() {
        return this.withTenant(async () => {
            const femeas = await this.prisma.animal.count({ where: { sexo: 'F', excluido: false, status: 'ATIVO' } });
            const machos = await this.prisma.animal.count({ where: { sexo: 'M', excluido: false, status: 'ATIVO' } });
            return [
                { label: 'Femeas', qtd: femeas },
                { label: 'Machos', qtd: machos }
            ];
        });
    }
    async getTotalCustoAnimaisComCusto() {
        return this.withTenant(async () => {
            const animaisAtivos = await this.prisma.animal.findMany({
                where: { excluido: false, status: 'ATIVO' },
                select: { id: true, total: true }
            });
            let valorAnimais = 0;
            const idAnimaisAtivos = animaisAtivos.map(a => {
                valorAnimais += a.total || 0;
                return a.id;
            });
            const custos = await this.prisma.custo.findMany({
                where: { excluido: false }
            });
            let valorCusto = 0;
            custos.forEach(c => {
                const idsNoCusto = c.id_animais;
                const intersection = idsNoCusto.filter(id => idAnimaisAtivos.includes(id));
                if (intersection.length > 0) {
                    valorCusto += ((c.valor_custo || 0) / idsNoCusto.length) * intersection.length;
                }
            });
            return {
                qtd_animais: idAnimaisAtivos.length,
                valor_animais_sem_custo: valorAnimais,
                valor_custo: valorCusto,
                valor_total: valorAnimais + valorCusto
            };
        });
    }
    async getTotalLotesPastosRacasClientesAtivos(query) {
        return this.withTenant(async () => {
            const response = { Lotes: {}, Pastos: {}, Racas: {}, Clientes: {} };
            if (query.lotes === 'true') {
                const data = await this.prisma.animal.groupBy({
                    by: ['id_lote'],
                    where: { excluido: false, status: 'ATIVO' },
                    _count: { id: true }
                });
                response.Lotes = { count: data.reduce((acc, curr) => acc + curr._count.id, 0) };
            }
            if (query.pastos === 'true') {
                const data = await this.prisma.animal.groupBy({
                    by: ['id_pasto'],
                    where: { excluido: false, status: 'ATIVO' },
                    _count: { id: true }
                });
                response.Pastos = { count: data.reduce((acc, curr) => acc + curr._count.id, 0) };
            }
            return response;
        });
    }
    async getTotalPorTipoCusto() {
        return this.withTenant(async () => {
            return [];
        });
    }
    async getTotalCusto12Meses() {
        return this.withTenant(async () => {
            const fazendaId = context_1.RequestContext.getFazendaId();
            return this.prisma.$queryRawUnsafe(`
                SELECT to_char("data_custo", 'YYYY-MM') AS "data_mes", SUM("valor_custo") AS "valor_total" 
                FROM "fazenda_${fazendaId}"."custo" 
                WHERE "excluido" = false 
                GROUP BY "data_mes" 
                ORDER BY data_mes ASC 
                LIMIT 12
            `);
        });
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = DashboardService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map