import { TenantPrismaService } from '../tenant/tenant-prisma.service';
export declare class DashboardService {
    private readonly tenantPrisma;
    private readonly logger;
    constructor(tenantPrisma: TenantPrismaService);
    private getTenantClient;
    getStats(): Promise<{
        counters: {
            ativos: number;
            vendidos: number;
            mortes: number;
            lotes: number;
            pastos: number;
            pesoMedio: string | number;
        };
        financeiro: {
            saldo_caixa: number | import("@prisma/client-runtime-utils").Decimal;
        };
    }>;
    getTotalMachoFemea(): Promise<{
        label: string;
        qtd: number;
    }[]>;
    getTotalCustoAnimaisComCusto(): Promise<{
        qtd_animais: number;
        valor_animais_sem_custo: number;
        valor_custo: number;
        valor_total: number;
    }>;
    getTotalLotesPastosRacasClientesAtivos(query: any): Promise<any>;
    getTotalPorTipoCusto(): Promise<never[]>;
    getTotalCusto12Meses(): Promise<{
        data_mes: string;
        valor_total: number;
    }[]>;
    getEvolucaoPeso(): Promise<{
        mes: string;
        pesoMedio: string;
    }[]>;
}
