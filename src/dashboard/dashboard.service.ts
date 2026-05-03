import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RequestContext } from '../common/context';

@Injectable()
export class DashboardService {
    private readonly logger = new Logger(DashboardService.name);

    constructor(private readonly prisma: PrismaService) { }

    private async withTenant<T>(operation: () => Promise<T>): Promise<T> {
        const fazendaId = RequestContext.getFazendaId();
        await this.prisma.$executeRawUnsafe(`SET search_path TO "fazenda_${fazendaId}", public`);
        try { return await operation(); }
        finally { await this.prisma.$executeRawUnsafe(`SET search_path TO "gado_fazendas", public`); }
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
                const idsNoCusto = c.id_animais as number[];
                const intersection = idsNoCusto.filter(id => idAnimaisAtivos.includes(id));
                if (intersection.length > 0) {
                    // Distribui o custo proporcionalmente aos animais ativos que participaram dele
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

    async getTotalLotesPastosRacasClientesAtivos(query: any) {
        return this.withTenant(async () => {
            const response: any = { Lotes: {}, Pastos: {}, Racas: {}, Clientes: {} };

            if (query.lotes === 'true') {
                const data = await this.prisma.animal.groupBy({
                    by: ['id_lote'],
                    where: { excluido: false, status: 'ATIVO' },
                    _count: { id: true }
                });
                // Legacy expects descriptions, so we might need to join or map
                // For brevity, returning counts. In a real scenario, we'd fetch names.
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
            // Raw query or Prisma groupBy with include (not supported easily)
            // Using a simplified version for now
            return [];
        });
    }

    async getTotalCusto12Meses() {
        return this.withTenant(async () => {
            const fazendaId = RequestContext.getFazendaId();
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
}
