import { Injectable, Logger } from '@nestjs/common';
import { TenantPrismaService } from '../tenant/tenant-prisma.service';
import { RequestContext } from '../common/context';

@Injectable()
export class DashboardService {
    private readonly logger = new Logger(DashboardService.name);

    constructor(private readonly tenantPrisma: TenantPrismaService) { }

    private getTenantClient() {
        const schemaName = RequestContext.getSchemaName();
        if (!schemaName) throw new Error('Schema do tenant não encontrado no contexto');
        return this.tenantPrisma.getClientForSchema(schemaName);
    }

    async getStats() {
        const tenant = this.getTenantClient();
        const fazendaId = RequestContext.getFazendaId();

        const baseWhere = { ativo: true, fazendaId };

        const [totalAnimais, totalVendido, totalMorte, totalLotes, totalPastos] = await Promise.all([
            tenant.animal.count({ where: { ...baseWhere, status: 'ATIVO' } }),
            tenant.animal.count({ where: { ...baseWhere, status: 'VENDIDO' } }),
            tenant.animal.count({ where: { ...baseWhere, status: 'MORTO' } }),
            tenant.lote.count({ where: { ativo: true, fazendaId } }),
            tenant.pasto.count({ where: { ativo: true, fazendaId } }),
        ]);

        const resumoFinanceiro = await tenant.caixa.aggregate({
            where: { ativo: true },
            _sum: { valor: true },
        });

        const animais = await tenant.animal.findMany({
            where: { ...baseWhere, status: 'ATIVO' },
            select: { pesoAtual: true }
        });
        const sumPeso = animais.reduce((acc, curr) => acc + Number(curr.pesoAtual || 0), 0);
        const avgPeso = animais.length > 0 ? (sumPeso / animais.length).toFixed(2) : 0;

        return {
            counters: {
                ativos: totalAnimais,
                vendidos: totalVendido,
                mortes: totalMorte,
                lotes: totalLotes,
                pastos: totalPastos,
                pesoMedio: avgPeso,
            },
            financeiro: {
                saldo_caixa: resumoFinanceiro._sum.valor || 0,
            }
        };
    }

    async getTotalMachoFemea() {
        const tenant = this.getTenantClient();
        const fazendaId = RequestContext.getFazendaId();

        const femeas = await tenant.animal.count({ where: { sexo: 'FEMEA', ativo: true, status: 'ATIVO', fazendaId } });
        const machos = await tenant.animal.count({ where: { sexo: 'MACHO', ativo: true, status: 'ATIVO', fazendaId } });
        return [
            { label: 'Femeas', qtd: femeas },
            { label: 'Machos', qtd: machos }
        ];
    }

    async getTotalCustoAnimaisComCusto() {
        const tenant = this.getTenantClient();
        const fazendaId = RequestContext.getFazendaId();

        const animaisAtivos = await tenant.animal.findMany({
            where: { ativo: true, status: 'ATIVO', fazendaId },
            select: { id: true, valorCompra: true, valorCustoTotal: true }
        });

        let valorAnimais = 0;
        let valorCusto = 0;

        animaisAtivos.forEach(a => {
            valorAnimais += Number(a.valorCompra || 0);
            valorCusto += Number(a.valorCustoTotal || 0);
        });

        return {
            qtd_animais: animaisAtivos.length,
            valor_animais_sem_custo: valorAnimais,
            valor_custo: valorCusto,
            valor_total: valorAnimais + valorCusto
        };
    }

    async getTotalLotesPastosRacasClientesAtivos(query: any) {
        const tenant = this.getTenantClient();
        const fazendaId = RequestContext.getFazendaId();
        const response: any = { Lotes: {}, Pastos: {}, Racas: {}, Clientes: {} };

        if (query.lotes === 'true') {
            const data = await tenant.animal.groupBy({
                by: ['loteId'],
                where: { ativo: true, status: 'ATIVO', fazendaId },
                _count: { id: true }
            });
            response.Lotes = { count: data.reduce((acc, curr) => acc + curr._count.id, 0) };
        }

        if (query.pastos === 'true') {
            const data = await tenant.animal.groupBy({
                by: ['pastoId'],
                where: { ativo: true, status: 'ATIVO', fazendaId },
                _count: { id: true }
            });
            response.Pastos = { count: data.reduce((acc, curr) => acc + curr._count.id, 0) };
        }

        return response;
    }

    async getTotalPorTipoCusto() {
        // const tenant = this.getTenantClient();
        return [];
    }

    async getTotalCusto12Meses() {
        const tenant = this.getTenantClient();
        // Fallback or precise implementation
        const dozeMesesAtras = new Date();
        dozeMesesAtras.setMonth(dozeMesesAtras.getMonth() - 12);

        const custos = await tenant.custo.findMany({
            where: { ativo: true, dataCusto: { gte: dozeMesesAtras } },
            select: { valorTotal: true, dataCusto: true }
        });

        // Grouping in memory since Prisma SQLite/Postgres dates grouping varies
        const map = new Map<string, number>();
        custos.forEach(c => {
            const dateStr = c.dataCusto.toISOString().substring(0, 7); // YYYY-MM
            map.set(dateStr, (map.get(dateStr) || 0) + Number(c.valorTotal));
        });

        const result = Array.from(map.entries()).map(([data_mes, valor_total]) => ({ data_mes, valor_total }));
        result.sort((a, b) => a.data_mes.localeCompare(b.data_mes));
        return result;
    }

    async getEvolucaoPeso() {
        const tenant = this.getTenantClient();
        const pesagens = await tenant.pesagem.findMany({
            select: { peso: true, dataPesagem: true },
            orderBy: { dataPesagem: 'asc' }
        });

        const map = new Map<string, { total: number, count: number }>();
        pesagens.forEach(p => {
            const dateStr = p.dataPesagem.toISOString().substring(0, 7); // YYYY-MM
            const current = map.get(dateStr) || { total: 0, count: 0 };
            map.set(dateStr, {
                total: current.total + Number(p.peso),
                count: current.count + 1
            });
        });

        const result = Array.from(map.entries()).map(([mes, stats]) => ({
            mes,
            pesoMedio: (stats.total / stats.count).toFixed(2)
        }));
        
        result.sort((a, b) => a.mes.localeCompare(b.mes));
        return result;
    }
}
